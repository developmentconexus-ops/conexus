import type { AppEntry, InvitationId } from '@conexus/hub-api'
import { CompanyId, Email, Person, ProjectId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { ProjectApps } from './app-invitations.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import {
  forgetLinks,
  hasPassword,
  inLibrary,
  linkTokenOf,
  refusedAs,
  storedAddress,
} from './auth.ts'
import { companyById } from './companies.ts'
import { LIVE, lockCompany, PendingRow, pending, Status } from './invitations.ts'
import { invitation, member, session } from './tables.ts'

const InvitationTarget = z.object({ email: Email, companyId: CompanyId })
// The acceptance also reads what the invitation gives: the company, or a Projeto's app and its role.
const AcceptedTarget = InvitationTarget.extend({
  projectId: ProjectId.nullable(),
  appRole: z.string().nullable(),
})
const ActionRow = PendingRow.and(z.object({ status: Status, live: z.boolean() }))
const JoinedRow = z.object({
  status: Status,
  revision: z.number().int().nonnegative(),
  live: z.boolean(),
  memberId: z.string().nullable(),
})
type InvitationAction = { invitationId: InvitationId; revision: number; person: Person | undefined }

async function lockedInvitation(tx: CommandTx, input: InvitationAction) {
  const [listed] = await tx
    .select({ email: invitation.email, companyId: invitation.organizationId })
    .from(invitation)
    .where(eq(invitation.id, input.invitationId))
  const found = InvitationTarget.optional().parse(listed)
  if (found === undefined) throw new Failure('NOT_FOUND')
  await lockCompany(tx, found.companyId)
  const [still] = await tx
    .select({ ...pending, status: invitation.status, live: sql<boolean>`${LIVE}` })
    .from(invitation)
    .where(eq(invitation.id, input.invitationId))
  // A deletion of the company that committed while this waited on its lock leaves no row (step 5).
  const row = ActionRow.optional().parse(still)
  if (row === undefined) throw new Failure('NOT_FOUND')
  if (input.person !== undefined && storedAddress(input.person.email) !== storedAddress(row.email))
    throw new Failure('NOT_FOUND')
  return row
}

function checkRevision(actual: number, expected: number): void {
  if (actual !== expected) throw new Failure('INVITATION_STALE')
}

async function advanceRevision(tx: CommandTx, invitationId: InvitationId): Promise<void> {
  await tx
    .update(invitation)
    .set({ revision: sql`${invitation.revision} + 1` })
    .where(eq(invitation.id, invitationId))
}

/** The link's scope: the invitation its address names, and the person signed in, if any. */
function invitationScope(input: { invitationId: InvitationId; person: Person | undefined }) {
  const personId = input.person?.id ?? null
  return { kind: 'INVITATION', invitationId: input.invitationId, personId } as const
}

export function passwordCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: InvitationAction & { name: string; password: string; headers: Headers }) =>
    deps.libraryCommand(invitationScope(input), async (tx) => {
      const open = await lockedInvitation(tx, input)
      if (open.status !== 'pending' || !open.live) throw new Failure('INVITATION_CLOSED')
      checkRevision(open.revision, input.revision)
      await transactionLock(tx, `conexus.person:${storedAddress(open.email)}`)
      const { internalAdapter } = await deps.auth.$context
      const known = await inLibrary(() => internalAdapter.findUserByEmail(open.email))
      const row =
        known?.user ??
        (
          await inLibrary(() =>
            deps.auth.api.createUser({ body: { name: input.name, email: open.email } }),
          )
        ).user
      const person = Person.parse(row)
      if (await hasPassword(deps.auth, person.id)) throw new Failure('INVITATION_PASSWORD_EXISTS')
      await inLibrary(() =>
        internalAdapter.updateUser(person.id, { name: input.name, emailVerified: true }),
      )
      await forgetLinks(tx, person.id)
      const token = await linkTokenOf(() =>
        inLibrary(() => deps.auth.api.requestPasswordReset({ body: { email: open.email } })),
      )
      await inLibrary(() =>
        deps.auth.api.resetPassword({ body: { token, newPassword: input.password } }),
      )
      await forgetLinks(tx, person.id)
      const signedIn = await inLibrary(() =>
        deps.auth.api.signInEmail({
          headers: input.headers,
          body: { email: open.email, password: input.password },
          returnHeaders: true,
        }),
      )
      await advanceRevision(tx, input.invitationId)
      return signedIn.headers.getSetCookie()
    })
}

export function declineCommand(deps: { libraryCommand: LibraryCommand }) {
  return (input: InvitationAction) =>
    deps.libraryCommand(invitationScope(input), async (tx) => {
      const open = await lockedInvitation(tx, input)
      if (open.status === 'rejected') return false
      if (open.status !== 'pending' || !open.live) throw new Failure('INVITATION_CLOSED')
      checkRevision(open.revision, input.revision)
      await tx
        .update(invitation)
        .set({ status: 'rejected', revision: sql`${invitation.revision} + 1` })
        .where(eq(invitation.id, input.invitationId))
      return true
    })
}

async function closeAccepted(tx: CommandTx, invitationId: InvitationId): Promise<void> {
  await tx
    .update(invitation)
    .set({ status: 'accepted', revision: sql`${invitation.revision} + 1` })
    .where(eq(invitation.id, invitationId))
}

type Acceptance = {
  person: Person
  headers: Headers
  invitationId: InvitationId
  revision: number
  sessionToken: string
}

/**
 * Accepts an app's invitation: the row and the `accepted` in one transaction (D22), never the
 * library's acceptance, which would make the person a member (better-auth 1.7.8
 * crud-invites.mjs:322). The Hub checks the deadline the library's acceptance would (`:268`), and
 * a Projeto deleted or marked since gives nothing. A repeat finds the row and gives the same app.
 */
async function acceptedApp(
  tx: CommandTx,
  apps: ProjectApps,
  input: Acceptance & { ids: { companyId: CompanyId; projectId: ProjectId }; role: string | null },
  joined: z.infer<typeof JoinedRow> | undefined,
): Promise<{ app: AppEntry; accepted: boolean }> {
  const { ids } = input
  const personId = input.person.id
  const found = await apps.appOf(tx, ids)
  if (found === undefined) throw new Failure('INVITATION_CLOSED')
  const app = { ...found, companyName: (await companyById(tx, ids.companyId)).name }
  if (joined?.status === 'accepted' && (await apps.uses(tx, { ...ids, personId }))) {
    return { app, accepted: false }
  }
  if (joined?.status !== 'pending' || !joined.live) throw new Failure('INVITATION_CLOSED')
  checkRevision(joined.revision, input.revision)
  await apps.grant(tx, { ...ids, personId, role: input.role })
  await closeAccepted(tx, input.invitationId)
  return { app, accepted: true }
}

/** Joins the company through the plugin's endpoint; one accepted already answers the same. */
async function acceptedCompany(
  auth: Auth,
  tx: CommandTx,
  input: Acceptance,
  joined: z.infer<typeof JoinedRow> | undefined,
): Promise<boolean> {
  if (joined?.status === 'accepted' && joined.memberId !== null) return false
  if (joined?.status !== 'pending') throw new Failure('INVITATION_CLOSED')
  checkRevision(joined.revision, input.revision)
  const body = { invitationId: input.invitationId }
  await refusedAs(() => auth.api.acceptInvitation({ headers: input.headers, body }), {
    INVITATION_NOT_FOUND: 'INVITATION_CLOSED',
    ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: 'COMPANY_FULL',
  })
  await advanceRevision(tx, input.invitationId)
  return true
}

export function acceptCommand(deps: {
  auth: Auth
  libraryCommand: LibraryCommand
  apps: ProjectApps
}) {
  return (input: Acceptance) =>
    deps.libraryCommand(invitationScope(input), async (tx) => {
      const [listed] = await tx
        .select({
          companyId: invitation.organizationId,
          email: invitation.email,
          projectId: invitation.projectId,
          appRole: invitation.appRole,
        })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
      const found = AcceptedTarget.optional().parse(listed)
      if (found === undefined || found.email !== storedAddress(input.person.email)) {
        throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
      }
      await lockCompany(tx, found.companyId)
      const [active] = await tx
        .select({ id: session.id })
        .from(session)
        .where(
          and(
            eq(session.token, input.sessionToken),
            eq(session.userId, input.person.id),
            sql`${session.expiresAt} > statement_timestamp()`,
          ),
        )
        .for('share')
      if (active === undefined) throw new Failure('SESSION_REQUIRED')
      const [row] = await tx
        .select({
          status: invitation.status,
          revision: invitation.revision,
          live: sql<boolean>`${LIVE}`,
          memberId: member.id,
        })
        .from(invitation)
        .leftJoin(
          member,
          and(
            eq(member.organizationId, invitation.organizationId),
            eq(member.userId, input.person.id),
          ),
        )
        .where(eq(invitation.id, input.invitationId))
      const joined = JoinedRow.optional().parse(row)
      const company = await companyById(tx, found.companyId)
      if (found.projectId !== null) {
        const ids = { companyId: found.companyId, projectId: found.projectId }
        const given = { ...input, ids, role: found.appRole }
        const made = await acceptedApp(tx, deps.apps, given, joined)
        return { company, ...made, projectId: found.projectId }
      }
      const accepted = await acceptedCompany(deps.auth, tx, input, joined)
      return { company, app: null, projectId: null, accepted }
    })
}
