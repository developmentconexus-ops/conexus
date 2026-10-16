import {
  CAPACITY,
  CompanyId,
  Email,
  InvitationId,
  PendingInvitation,
  Person,
  Role,
} from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Admitted } from './admission.ts'
import { admit } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { forgetLinks, hasPassword, linkTokenOf, refusedAs, storedAddress } from './auth.ts'
import { companyById } from './companies.ts'
import { company, invitation, member, user, verification } from './tables.ts'

// The founder's number, step 4 answer 6: invitations per person and minute.
const INVITATION_PACE = { most: 10, window: sql`interval '1 minute'` }
export const Status = z.enum(['pending', 'accepted', 'canceled'])

export const pending = {
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  expiresAt: invitation.expiresAt,
}

/** Still open by the database's clock; the plugin's own check reads the application's. */
export const LIVE = sql`${invitation.expiresAt} > statement_timestamp()`
const ADDRESS = sql`lower(${invitation.email})`

export const PendingRow = z.object({
  id: InvitationId,
  email: Email,
  role: Role,
  expiresAt: z.date(),
})
const AttemptRow = PendingRow.extend({ unmailed: z.boolean() })
const InvitationEmail = z.object({ email: Email })
const OpenRow = z.object({ id: InvitationId })
const AcceptRow = z.object({ companyId: CompanyId, email: Email })
const JoinedRow = z.object({ status: Status, memberId: z.string().nullable() })

export function pendingOf(row: z.infer<typeof PendingRow>) {
  return PendingInvitation.parse({ ...row, expiresAt: row.expiresAt.toISOString() })
}

/**
 * Inviting and accepting first lock the company, so the two serialize in one order and never
 * deadlock (C65, D23). The lock leaves foreign keys free: a new member still references the row.
 */
async function lockCompany(tx: CommandTx, companyId: string): Promise<void> {
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
}

async function attemptOf(tx: CommandTx, admitted: Admitted, attemptKey: string) {
  const [same] = await tx
    .select({
      ...pending,
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

async function checkPace(tx: CommandTx, personId: string): Promise<void> {
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
    .select({ id: invitation.id })
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
        if (same.email !== email || same.role !== input.role) {
          throw new Failure('IDEMPOTENCY_CONFLICT')
        }
        // Committed but never answered by the provider, as when the Hub stopped before the send:
        // the replay sends it again, so delivery is at least once (C64).
        if (same.unmailed) return { ...(await createdOf(tx, admitted, same.id)), created: false }
        return { invitation: pendingOf(same), mail: undefined, created: false }
      }
      await checkRoom(tx, admitted, email)
      const open = await openOf(tx, admitted, email)
      if (open !== undefined) {
        await deps.auth.api.cancelInvitation({ headers, body: { invitationId: open.id } })
      }
      await checkPace(tx, personId)
      const { attemptKey, role } = input
      const body = { email, role, organizationId: admitted.companyId, attemptKey }
      const created = await refusedAs(() => deps.auth.api.createInvitation({ headers, body }), {
        USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: 'MEMBER_EXISTS',
        YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: 'INVITATION_ROLE_REFUSED',
      })
      return { ...(await createdOf(tx, admitted, created.id)), created: true }
    })
}

// The founder's pace, step 4 answer 6: one link every 20 seconds per invited person.
const LINK_PACE = sql`interval '20 seconds'`

/**
 * Gives the invited e-mail a link to create its password: the person is created if missing, and a
 * person who has a password gets nothing. Answers the token and whom to send it to.
 */
export function passwordLinkCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: { invitationId: InvitationId; name: string }) =>
    deps.libraryCommand(async (tx) => {
      const [listed] = await tx
        .select({ email: invitation.email })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
      const found = InvitationEmail.optional().parse(listed)
      if (found === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'UNKNOWN' } })
      // The e-mail is the person's lock: two requests at once make one person and one link.
      await transactionLock(tx, `conexus.person:${found.email}`)
      const [still] = await tx
        .select({ email: invitation.email })
        .from(invitation)
        .where(and(eq(invitation.id, input.invitationId), eq(invitation.status, 'pending'), LIVE))
      const open = InvitationEmail.optional().parse(still)
      if (open === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'CLOSED' } })
      const { internalAdapter } = await deps.auth.$context
      const known = await internalAdapter.findUserByEmail(open.email)
      const row =
        known?.user ??
        (await deps.auth.api.createUser({ body: { name: input.name, email: open.email } })).user
      const person = Person.parse(row)
      if (await hasPassword(deps.auth, person.id)) {
        return { kind: 'HAS_PASSWORD' } as const
      }
      const given = await tx.$count(
        verification,
        and(
          eq(verification.value, person.id),
          sql`${verification.createdAt} > statement_timestamp() - ${LINK_PACE}`,
        ),
      )
      if (given > 0) throw new Failure('PASSWORD_LINKS_EXCEEDED')
      await forgetLinks(tx, person.id)
      const token = await linkTokenOf(() =>
        deps.auth.api.requestPasswordReset({ body: { email: open.email } }),
      )
      return { kind: 'LINK', token, email: open.email, name: person.name } as const
    })
}

/**
 * Accepts an invitation for the person it was sent to. Accepting again answers the same company;
 * the plugin decides the deadline, the state and the company's capacity (K21r, K23).
 */
export function acceptCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: { person: Person; headers: Headers; invitationId: InvitationId }) =>
    deps.libraryCommand(async (tx) => {
      const [listed] = await tx
        .select({ companyId: invitation.organizationId, email: invitation.email })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
      const found = AcceptRow.optional().parse(listed)
      if (found === undefined || found.email !== storedAddress(input.person.email)) {
        throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
      }
      await lockCompany(tx, found.companyId)
      const [row] = await tx
        .select({ status: invitation.status, memberId: member.id })
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
        const body = { invitationId: input.invitationId }
        await refusedAs(() => deps.auth.api.acceptInvitation({ headers: input.headers, body }), {
          INVITATION_NOT_FOUND: 'INVITATION_CLOSED',
          ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: 'COMPANY_FULL',
        })
      }
      return { company: await companyById(tx, found.companyId), accepted: !already }
    })
}
