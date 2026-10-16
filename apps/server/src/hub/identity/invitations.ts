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
import type { Admitted } from './admission.ts'
import { admit } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { refusedAs, storedAddress } from './auth.ts'
import { companyById } from './companies.ts'
import { company, invitation, user } from './tables.ts'

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
  headers: Headers
  companyId: CompanyId
  email: Email
  role: Role
  attemptKey: string
  replaces?: z.infer<typeof Replacement>
}

async function attemptOf(tx: CommandTx, admitted: Admitted, attemptKey: string) {
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
async function checkRoom(tx: CommandTx, admitted: Admitted, email: string): Promise<void> {
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
async function openOf(tx: CommandTx, admitted: Admitted, email: string) {
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

async function createdOf(tx: CommandTx, admitted: Admitted, invitationId: string) {
  const [row] = await tx.select(pending).from(invitation).where(eq(invitation.id, invitationId))
  if (row === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'invitation not read' } })
  }
  const companyName = (await companyById(tx, admitted.companyId)).name
  return { invitation: pendingOf(PendingRow.parse(row)), mail: { companyName } }
}

/**
 * Invites an e-mail. The Hub owns the count of open invitations and the pace of each person, under
 * the company's lock; the plugin owns the roles, the member check and the row (K21r, K23).
 */
export function createInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: Invite) =>
    deps.libraryCommand(async (tx) => {
      const email = storedAddress(input.email)
      const { headers } = input
      await lockCompany(tx, input.companyId)
      const personId = input.person.id
      const admitted = await admit({ tx, personId, companyId: input.companyId, action: 'invite' })
      await tx.select({ id: user.id }).from(user).where(eq(user.id, personId)).for('no key update')
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
        if (same.unmailed) return { ...(await createdOf(tx, admitted, same.id)), created: false }
        return { invitation: pendingOf(same), mail: undefined, created: false }
      }
      await checkRoom(tx, admitted, email)
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
      if (open !== undefined) {
        await deps.auth.api.cancelInvitation({ headers, body: { invitationId: open.id } })
        await tx
          .update(invitation)
          .set({
            revision: sql`${invitation.revision} + 1`,
            ...(input.replaces !== undefined ? { supersededAt: sql`statement_timestamp()` } : {}),
          })
          .where(eq(invitation.id, open.id))
      }
      await checkPace(tx, personId)
      const { attemptKey, role } = input
      const body = { email, role, organizationId: admitted.companyId, attemptKey }
      const created = await refusedAs(() => deps.auth.api.createInvitation({ headers, body }), {
        USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: 'MEMBER_EXISTS',
        YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: 'INVITATION_ROLE_REFUSED',
      })
      if (input.replaces !== undefined)
        await tx
          .update(invitation)
          .set({ replaces: input.replaces })
          .where(eq(invitation.id, created.id))
      return { ...(await createdOf(tx, admitted, created.id)), created: true }
    })
}
