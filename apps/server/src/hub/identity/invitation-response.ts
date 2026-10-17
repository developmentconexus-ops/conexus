import type { InvitationId } from '@conexus/hub-api'
import { CompanyId, Email, Person } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
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
const ActionRow = PendingRow.extend({ status: Status, live: z.boolean() })
const JoinedRow = z.object({
  status: Status,
  revision: z.number().int().nonnegative(),
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
  const row = ActionRow.parse(still)
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

export function acceptCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: {
    person: Person
    headers: Headers
    invitationId: InvitationId
    revision: number
    sessionToken: string
  }) =>
    deps.libraryCommand(invitationScope(input), async (tx) => {
      const [listed] = await tx
        .select({ companyId: invitation.organizationId, email: invitation.email })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
      const found = InvitationTarget.optional().parse(listed)
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
        .select({ status: invitation.status, revision: invitation.revision, memberId: member.id })
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
      const already = joined?.status === 'accepted' && joined.memberId !== null
      if (!already) {
        if (joined?.status !== 'pending') throw new Failure('INVITATION_CLOSED')
        checkRevision(joined.revision, input.revision)
        const body = { invitationId: input.invitationId }
        await refusedAs(() => deps.auth.api.acceptInvitation({ headers: input.headers, body }), {
          INVITATION_NOT_FOUND: 'INVITATION_CLOSED',
          ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: 'COMPANY_FULL',
        })
        await advanceRevision(tx, input.invitationId)
      }
      return { company: await companyById(tx, found.companyId), accepted: !already }
    })
}
