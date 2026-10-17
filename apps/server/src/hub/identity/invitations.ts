import type { CompanyId, Person } from '@conexus/hub-api'
import {
  CAPACITY,
  createInvitation,
  Email,
  InvitationId,
  PendingInvitation,
  Role,
} from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CompanyProof, OwnerInviterProof } from './admission.ts'
import { admitInviter, isOperator, mayInviteAs } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { organizationAdapter, storedAddress } from './auth.ts'
import { companyById } from './companies.ts'
import type { Inviter } from './messages.ts'
import { company, invitation, member, user } from './tables.ts'

// The founder's number, step 4 answer 6: invitations per person and minute.
const INVITATION_PACE = { most: 10, window: sql`interval '1 minute'` }
export const Status = z.enum(['pending', 'accepted', 'rejected', 'canceled'])

export const pending = {
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  expiresAt: invitation.expiresAt,
  revision: invitation.revision,
}

/** Still open by the database's clock; the plugin's own check reads the application's. */
export const LIVE = sql`${invitation.expiresAt} > statement_timestamp()`
const ADDRESS = sql`lower(${invitation.email})`

export const PendingRow = z.object({
  id: InvitationId,
  email: Email,
  role: Role,
  expiresAt: z.date(),
  revision: z.number().int().nonnegative(),
})
const Replacement = createInvitation.input.body.shape.replaces.unwrap()
const AttemptRow = PendingRow.extend({
  unmailed: z.boolean(),
  status: Status,
  live: z.boolean(),
  replaces: Replacement.nullable(),
})
const OpenRow = PendingRow.extend({ live: z.boolean() })

export function pendingOf(row: z.infer<typeof PendingRow>) {
  return PendingInvitation.parse({
    ...row,
    state: 'PENDING',
    expiresAt: row.expiresAt.toISOString(),
  })
}

/**
 * Inviting and accepting first lock the company, so the two serialize in one order and never
 * deadlock (C65, D23). The lock leaves foreign keys free: a new member still references the row.
 */
export async function lockCompany(tx: CommandTx, companyId: string): Promise<void> {
  await tx
    .select({ id: company.id })
    .from(company)
    .where(eq(company.id, companyId))
    .for('no key update')
}

type Invite = {
  person: Person
  companyId: CompanyId
  email: Email
  role: Role
  attemptKey: string
  replaces?: z.infer<typeof Replacement>
}

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

/** Room for one more open invitation: the address's own, about to be replaced, does not count. */
async function checkRoom(tx: CommandTx, admitted: CompanyProof, email: string): Promise<void> {
  const live = await tx.$count(
    invitation,
    and(
      eq(invitation.organizationId, admitted.companyId),
      eq(invitation.status, 'pending'),
      sql`${ADDRESS} <> ${email}`,
      LIVE,
    ),
  )
  if (live >= CAPACITY.openInvitations) throw new Failure('INVITATIONS_FULL')
}

export async function checkPace(tx: CommandTx, personId: string): Promise<void> {
  const recent = await tx.$count(
    invitation,
    and(
      eq(invitation.inviterId, personId),
      sql`${invitation.createdAt} > statement_timestamp() - ${INVITATION_PACE.window}`,
    ),
  )
  if (recent >= INVITATION_PACE.most) throw new Failure('INVITATIONS_EXCEEDED')
}

/**
 * The address's open invitation, by the unique index and with no clock: an expired one the plugin
 * no longer sees still holds the index, so it is canceled too (D15).
 */
async function openOf(tx: CommandTx, admitted: CompanyProof, email: string) {
  const [open] = await tx
    .select({ ...pending, live: sql<boolean>`${LIVE}` })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, admitted.companyId),
        sql`${ADDRESS} = ${email}`,
        eq(invitation.status, 'pending'),
      ),
    )
  return OpenRow.optional().parse(open)
}

/** On a company with no member only the operator invites, as Conexus, its first owner (step 4.2). */
export function inviterOf(admitted: CompanyProof, person: Person): Inviter {
  if (admitted.kind === 'OWNER_INVITER') return { kind: 'CONEXUS' }
  return { kind: 'MEMBER', name: person.name }
}

async function createdOf(
  tx: CommandTx,
  input: { admitted: CompanyProof; person: Person; invitationId: string },
) {
  const { admitted, invitationId } = input
  const [row] = await tx.select(pending).from(invitation).where(eq(invitation.id, invitationId))
  if (row === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'invitation not read' } })
  }
  const companyName = (await companyById(tx, admitted.companyId)).name
  const inviter = inviterOf(admitted, input.person)
  return { invitation: pendingOf(PendingRow.parse(row)), mail: { companyName, inviter } }
}

/** The inviter's row, held until commit: the pace counts their invitations one at a time. */
export async function lockedInviter(tx: CommandTx, personId: string) {
  const [inviter] = await tx.select().from(user).where(eq(user.id, personId)).for('no key update')
  if (inviter === undefined) throw new Failure('SESSION_REQUIRED')
  return inviter
}

/** The plugin's endpoints refuse an address already in the company; its adapter does not. */
export async function checkNotMember(tx: CommandTx, admitted: CompanyProof, email: string) {
  const [joined] = await tx
    .select({ id: member.id })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, admitted.companyId), eq(user.email, email)))
  if (joined !== undefined) throw new Failure('MEMBER_EXISTS')
}

/**
 * The operator invites one first owner at a time, never an operator: Conexus is never a member
 * (step 4.2). An expired one the operator replaces is not live, so it does not count.
 */
async function checkOwnerInvitation(tx: CommandTx, admitted: OwnerInviterProof, email: Email) {
  const live = await tx.$count(
    invitation,
    and(
      eq(invitation.organizationId, admitted.companyId),
      eq(invitation.role, 'owner'),
      eq(invitation.status, 'pending'),
      LIVE,
    ),
  )
  if (live > 0) throw new Failure('OWNER_INVITATION_OPEN')
  if (await isOperator(tx, email)) throw new Failure('CLIENT_OWNER_IS_OPERATOR')
}

/** Cancels the address's open invitation; a replacement also marks it superseded (4.1 decision B). */
async function cancelOpen(auth: Auth, tx: CommandTx, invitationId: string, superseded: boolean) {
  const adapter = await organizationAdapter(auth)
  await adapter.updateInvitation({ invitationId, status: 'canceled' })
  await tx
    .update(invitation)
    .set({
      revision: sql`${invitation.revision} + 1`,
      ...(superseded ? { supersededAt: sql`statement_timestamp()` } : {}),
    })
    .where(eq(invitation.id, invitationId))
}

/**
 * Invites an e-mail. The Hub owns who may invite with which role, the count of open invitations
 * and the pace of each person, under the company's lock; the plugin's adapter writes the row.
 */
export function createInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: Invite) =>
    deps.libraryCommand(async (tx) => {
      const email = storedAddress(input.email)
      await lockCompany(tx, input.companyId)
      const personId = input.person.id
      const admitted = await admitInviter({ tx, personId, companyId: input.companyId })
      const inviter = await lockedInviter(tx, personId)
      const same = await attemptOf(tx, admitted, input.attemptKey)
      if (same !== undefined) {
        if (
          same.email !== email ||
          same.role !== input.role ||
          same.replaces?.id !== input.replaces?.id ||
          same.replaces?.revision !== input.replaces?.revision
        ) {
          throw new Failure('IDEMPOTENCY_CONFLICT')
        }
        if (same.status !== 'pending' || !same.live) throw new Failure('INVITATION_CLOSED')
        // Committed but never answered by the provider, as when the Hub stopped before the send:
        // the replay sends it again, so delivery is at least once (C64).
        if (same.unmailed) {
          const replayed = { admitted, person: input.person, invitationId: same.id }
          return { ...(await createdOf(tx, replayed)), created: false }
        }
        return { invitation: pendingOf(same), mail: undefined, created: false }
      }
      if (!mayInviteAs(admitted).includes(input.role)) throw new Failure('INVITATION_ROLE_REFUSED')
      await checkRoom(tx, admitted, email)
      if (admitted.kind === 'OWNER_INVITER') await checkOwnerInvitation(tx, admitted, input.email)
      const open = await openOf(tx, admitted, email)
      if (input.replaces !== undefined) {
        if (
          open === undefined ||
          open.id !== input.replaces.id ||
          open.live ||
          open.revision !== input.replaces.revision ||
          open.role !== input.role
        )
          throw new Failure('INVITATION_STALE')
      }
      if (open !== undefined) await cancelOpen(deps.auth, tx, open.id, input.replaces !== undefined)
      await checkNotMember(tx, admitted, email)
      await checkPace(tx, personId)
      const { attemptKey, role } = input
      const adapter = await organizationAdapter(deps.auth)
      const created = await adapter.createInvitation({
        invitation: { email, role, organizationId: admitted.companyId, teamIds: [], attemptKey },
        user: inviter,
      })
      if (input.replaces !== undefined)
        await tx
          .update(invitation)
          .set({ replaces: input.replaces })
          .where(eq(invitation.id, created.id))
      const made = { admitted, person: input.person, invitationId: created.id }
      return { ...(await createdOf(tx, made)), created: true }
    })
}
