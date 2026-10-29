import type { CompanyId, Email, Person, ProjectId, Role } from '@conexus/hub-api'
import { CAPACITY, createInvitation, InvitationId } from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CompanyProof } from './admission.ts'
import { admit, admitCompany } from './admission.ts'
import type { ProjectApps } from './app-invitations.ts'
import { cancelAppInvitations, checkAppInvitation } from './app-invitations.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { organizationAdapter, refusedAs, storedAddress } from './auth.ts'
import { companyById } from './companies.ts'
import type { Invited } from './invitations.ts'
import {
  ADDRESS,
  AppPendingRow,
  CompanyPendingRow,
  cancelThrough,
  checkOwnerInvitation,
  checkPace,
  companyScope,
  INVITATION_REFUSALS,
  inviterOf,
  LIVE,
  lockCompany,
  lockedInviter,
  PendingRow,
  PROJECT_KEY,
  pending,
  Status,
} from './invitations.ts'
import type { InvitationGives } from './messages.ts'
import { invitation } from './tables.ts'

const Replacement = createInvitation.input.body.shape.replaces.unwrap()
const AttemptRow = PendingRow.and(
  z.object({
    unmailed: z.boolean(),
    status: Status,
    live: z.boolean(),
    replaces: Replacement.nullable(),
  }),
)
const OpenRow = PendingRow.and(z.object({ live: z.boolean() }))

type Invite = {
  person: Person
  headers: Headers
  companyId: CompanyId
  email: Email
  attemptKey: string
}
/** An invitation into the company; `replaces` names the expired one it renews (4.1 decision B). */
export type CompanyInvite = Invite & { role: Role; replaces?: z.infer<typeof Replacement> }
/** An invitation to use a Projeto's app, with a role the published version declares, or none. */
export type AppInvite = Invite & { projectId: ProjectId; role: string | null }
type Inviting = Invite & { invited: Invited; replaces?: z.infer<typeof Replacement> }

async function attemptOf(tx: CommandTx, admitted: CompanyProof, attemptKey: string) {
  const [same] = await tx
    .select({
      ...pending,
      status: invitation.status,
      live: sql<boolean>`${LIVE}`,
      replaces: invitation.replaces,
      unmailed: sql<boolean>`${invitation.status} = 'pending' and ${invitation.mailedAt} is null
        and ${LIVE}`,
    })
    .from(invitation)
    .where(
      and(eq(invitation.organizationId, admitted.companyId), eq(invitation.attemptKey, attemptKey)),
    )
  return AttemptRow.optional().parse(same)
}

function sameInvited(row: PendingRow, invited: Invited): boolean {
  if (row.kind === 'APP' && invited.kind === 'APP') {
    return row.projectId === invited.projectId && row.role === invited.role
  }
  return row.kind === invited.kind && row.role === invited.role
}

function projectKeyOf(invited: Invited): string {
  return invited.kind === 'APP' ? invited.projectId : ''
}

/**
 * Room for one more open invitation, of either kind: the limit and the pace guard the e-mail the
 * Hub sends. The address's own for the same Projeto, about to be replaced, does not count.
 */
async function checkRoom(tx: CommandTx, admitted: CompanyProof, input: Inviting, email: string) {
  const live = await tx.$count(
    invitation,
    and(
      eq(invitation.organizationId, admitted.companyId),
      eq(invitation.status, 'pending'),
      sql`(${ADDRESS}, ${PROJECT_KEY}) <> (${email}, ${projectKeyOf(input.invited)})`,
      LIVE,
    ),
  )
  if (live >= CAPACITY.openInvitations) throw new Failure('INVITATIONS_FULL')
}

/**
 * The address's open invitation for the same Projeto, or into the company, by the unique index and
 * with no clock: an expired one the plugin no longer sees still holds the index, so it is canceled
 * too (D15).
 */
async function openOf(tx: CommandTx, admitted: CompanyProof, input: Inviting, email: string) {
  const [open] = await tx
    .select({ ...pending, live: sql<boolean>`${LIVE}` })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, admitted.companyId),
        sql`${ADDRESS} = ${email}`,
        sql`${PROJECT_KEY} = ${projectKeyOf(input.invited)}`,
        eq(invitation.status, 'pending'),
      ),
    )
  return OpenRow.optional().parse(open)
}

async function createdOf<T>(
  tx: CommandTx,
  input: { admitted: CompanyProof; person: Person; invitationId: InvitationId; apps: ProjectApps },
  shown: z.ZodType<T>,
) {
  const { admitted, invitationId } = input
  const [found] = await tx.select(pending).from(invitation).where(eq(invitation.id, invitationId))
  const row = PendingRow.optional().parse(found)
  if (row === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'invitation not read' } })
  }
  const companyName = (await companyById(tx, admitted.companyId)).name
  const inviter = inviterOf(admitted, input.person)
  const sent = { ...row, expiresAt: row.expiresAt.toISOString() }
  const gives = await givesOf(tx, input.apps, { row, companyId: admitted.companyId })
  return { row: shown.parse(found), mail: { sent, companyName, inviter, gives } }
}

/** What the invitation's e-mail says it gives; an app's Projeto deleted since gives nothing. */
async function givesOf(
  tx: ReadTx,
  apps: ProjectApps,
  input: { row: PendingRow; companyId: CompanyId },
): Promise<InvitationGives> {
  const { row, companyId } = input
  if (row.kind === 'COMPANY') return { kind: 'COMPANY', role: row.role }
  const app = await apps.appOf(tx, { companyId, projectId: row.projectId })
  if (app === undefined) throw new Failure('INVITATION_CLOSED')
  return { kind: 'APP', appName: app.projectName }
}

type Open = {
  admitted: CompanyProof
  headers: Headers
  invitationId: InvitationId
  kind: Invited['kind']
  superseded: boolean
}

/** Cancels the address's open invitation; a replacement also marks it superseded (4.1 decision B). */
async function cancelOpen(auth: Auth, tx: CommandTx, input: Open) {
  const { invitationId, superseded } = input
  await cancelThrough(auth, input)
  await tx
    .update(invitation)
    .set({
      revision: sql`${invitation.revision} + 1`,
      ...(superseded ? { supersededAt: sql`statement_timestamp()` } : {}),
    })
    .where(eq(invitation.id, invitationId))
}

/**
 * Writes the invitation: a member's into the company through the plugin's endpoint, which owns the
 * roles and the member check (K21r, K23); the owner's, by the operator who is no member, and an
 * app's, which the endpoint would refuse beside the address's other open invitations
 * (better-auth 1.7.8 crud-invites.mjs:128-132), through its adapter, with `role` NULL and the
 * Projeto and the role in the app in the Hub's two fields (docs/reference/boundaries.md).
 */
async function written(
  auth: Auth,
  tx: CommandTx,
  input: { admitted: CompanyProof; invite: Inviting; email: string },
) {
  const { admitted, invite, email } = input
  const { attemptKey, invited } = invite
  const organizationId = admitted.companyId
  if (invited.kind === 'COMPANY' && admitted.kind === 'MEMBER') {
    const body = { email, role: invited.role, organizationId, attemptKey }
    return refusedAs(
      () => auth.api.createInvitation({ headers: invite.headers, body }),
      INVITATION_REFUSALS,
    )
  }
  const inviter =
    admitted.kind === 'COMPANY_OPERATOR'
      ? admitted.inviter
      : await lockedInviter(tx, admitted.personId)
  const adapter = await organizationAdapter(auth)
  const row = { email, organizationId, teamIds: [], attemptKey }
  if (invited.kind === 'COMPANY') {
    return adapter.createInvitation({ invitation: { ...row, role: invited.role }, user: inviter })
  }
  const app = { projectId: invited.projectId, appRole: invited.role }
  return adapter.createInvitation({
    // @ts-expect-error: better-auth 1.7.8 types the role as a string; an app's invitation has none, and the adapter writes the row as given (organization/adapter.mjs:728-742).
    invitation: { ...row, role: null, ...app },
    user: inviter,
  })
}

/** What the company's or the app's refusals need before the write, under the company's lock. */
async function checkInvited(
  tx: CommandTx,
  input: { admitted: CompanyProof; invite: Inviting; email: string; apps: ProjectApps },
) {
  const { admitted, invite, email } = input
  const { invited } = invite
  if (invited.kind === 'COMPANY') {
    if (admitted.kind === 'COMPANY_OPERATOR') {
      await checkOwnerInvitation(tx, { admitted, email: invite.email, role: invited.role })
    }
    return
  }
  const { projectId, role } = invited
  await checkAppInvitation(
    tx,
    { companyId: admitted.companyId, email, projectId, role },
    input.apps,
  )
}

/** Who may send it: into the company, `invite`; to an app, `manageAppAccess` (step 18, B). */
async function admittedInviter(tx: CommandTx, input: Inviting): Promise<CompanyProof> {
  const personId = input.person.id
  const { companyId } = input
  const admitted =
    input.invited.kind === 'COMPANY'
      ? await admitCompany({ tx, personId, companyId, action: 'invite' })
      : await admit({ tx, personId, companyId, action: 'manageAppAccess' })
  // The operator's admission already holds the row.
  if (admitted.kind === 'MEMBER') await lockedInviter(tx, personId)
  return admitted
}

/** A repeated attempt key answers its invitation only for the same request, still open. */
function checkReplay(same: z.infer<typeof AttemptRow>, input: Inviting, email: string): void {
  if (
    same.email !== email ||
    !sameInvited(same, input.invited) ||
    same.replaces?.id !== input.replaces?.id ||
    same.replaces?.revision !== input.replaces?.revision
  ) {
    throw new Failure('IDEMPOTENCY_CONFLICT')
  }
  if (same.status !== 'pending' || !same.live) throw new Failure('INVITATION_CLOSED')
}

/**
 * Cancels the address's open invitation the new one takes the place of; a renewal names the
 * expired one it replaces, and any other open one makes it stale.
 */
async function replaceOpen(
  auth: Auth,
  tx: CommandTx,
  args: { admitted: CompanyProof; input: Inviting; email: string },
) {
  const { admitted, input } = args
  const open = await openOf(tx, admitted, input, args.email)
  const { replaces } = input
  if (
    replaces !== undefined &&
    (open === undefined ||
      open.id !== replaces.id ||
      open.live ||
      open.revision !== replaces.revision ||
      !sameInvited(open, input.invited))
  )
    throw new Failure('INVITATION_STALE')
  if (open === undefined) return
  const { headers } = input
  const superseded = replaces !== undefined
  await cancelOpen(auth, tx, {
    admitted,
    headers,
    invitationId: open.id,
    kind: open.kind,
    superseded,
  })
}

type InviteDeps = {
  auth: Auth
  database: Database
  libraryCommand: LibraryCommand
  apps: ProjectApps
}

/**
 * Invites an e-mail, into the company or to one of its apps. The Hub owns the count of open
 * invitations and the pace of each person, under the company's lock, and the operator's one owner
 * at a time; the plugin writes the row. A company invitation cancels the address's open app
 * invitations first (step 18, I); `canceled` names their Projetos.
 */
function inviting<T>(deps: InviteDeps, shown: z.ZodType<T>) {
  return (input: Inviting) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const email = storedAddress(input.email)
      await lockCompany(tx, input.companyId)
      const admitted = await admittedInviter(tx, input)
      const made = { admitted, person: input.person, apps: deps.apps }
      const same = await attemptOf(tx, admitted, input.attemptKey)
      if (same !== undefined) {
        checkReplay(same, input, email)
        const replayed = await createdOf(tx, { ...made, invitationId: same.id }, shown)
        // Committed but never answered by the provider, as when the Hub stopped before the send:
        // the replay sends it again, so delivery is at least once (C64).
        const mail = same.unmailed ? replayed.mail : undefined
        return { row: replayed.row, mail, created: false, canceled: [] }
      }
      await checkInvited(tx, { admitted, invite: input, email, apps: deps.apps })
      await checkRoom(tx, admitted, input, email)
      await replaceOpen(deps.auth, tx, { admitted, input, email })
      const canceled =
        input.invited.kind === 'COMPANY'
          ? await cancelAppInvitations(deps.auth, tx, { companyId: input.companyId, email })
          : []
      await checkPace(deps.database, tx, input.person.id)
      const created = await written(deps.auth, tx, { admitted, invite: input, email })
      if (input.replaces !== undefined)
        await tx
          .update(invitation)
          .set({ replaces: input.replaces })
          .where(eq(invitation.id, created.id))
      const invitationId = InvitationId.parse(created.id)
      return { ...(await createdOf(tx, { ...made, invitationId }, shown)), created: true, canceled }
    })
}

export function createInvitationCommand(deps: InviteDeps) {
  const invite = inviting(deps, CompanyPendingRow)
  return ({ role, ...input }: CompanyInvite) =>
    invite({ ...input, invited: { kind: 'COMPANY', role } })
}

export function inviteToAppCommand(deps: InviteDeps) {
  const invite = inviting(deps, AppPendingRow)
  return ({ projectId, role, ...input }: AppInvite) =>
    invite({ ...input, invited: { kind: 'APP', projectId, role } })
}
