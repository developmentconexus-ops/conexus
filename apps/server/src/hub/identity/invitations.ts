import type { CompanyId, InvitationId, Person, Role } from '@conexus/hub-api'
import { Company, Email, PAGE_SIZE, PendingInvitation, ReceivedInvitation } from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Admitted } from './admission.ts'
import { admit } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { forgetLinks, linkTokenOf, refusedAs } from './auth.ts'
import { pageOf } from './companies.ts'
import { company, invitation, member, user } from './tables.ts'

// The founder's numbers, step 4 answer 6: open invitations per company, and per person and minute.
const INVITATION_CAPACITY = 100
const INVITATIONS_PER_MINUTE = 10
const COUNT = z.object({ count: z.coerce.number().int() })
const Status = z.enum(['pending', 'accepted', 'canceled'])

const pending = {
  id: invitation.id,
  email: invitation.email,
  role: invitation.role,
  expiresAt: invitation.expiresAt,
}

function pendingOf(row: { id: string; email: string; role: string | null; expiresAt: Date }) {
  return PendingInvitation.parse({ ...row, expiresAt: row.expiresAt.toISOString() })
}

async function counted(tx: CommandTx, query: ReturnType<typeof sql>): Promise<number> {
  const result = await tx.execute(query)
  return COUNT.parse(result.rows[0]).count
}

/**
 * Inviting and accepting first lock the company, so the two serialize in one order and never
 * deadlock (C65, D23). The lock leaves foreign keys free: a new member still references the row.
 */
async function lockCompany(tx: CommandTx, companyId: string): Promise<void> {
  await tx.execute(sql`select id from auth.company where id = ${companyId} for no key update`)
}

export async function readInvitations(tx: ReadTx, admitted: Admitted, page: string | undefined) {
  const rows = await tx
    .select(pending)
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, admitted.companyId),
        eq(invitation.status, 'pending'),
        page === undefined
          ? undefined
          : sql`(${invitation.createdAt}, ${invitation.id}) > (select created_at, id
              from auth.invitation where id = ${page} and company_id = ${admitted.companyId})`,
      ),
    )
    .orderBy(asc(invitation.createdAt), asc(invitation.id))
    .limit(PAGE_SIZE + 1)
  const listed = pageOf(rows, (row) => row.id)
  return { invitations: listed.rows.map(pendingOf), next: listed.next }
}

function stateOf(status: z.infer<typeof Status>, expiresAt: Date): ReceivedInvitation['state'] {
  if (status === 'accepted') return 'ACCEPTED'
  if (status === 'canceled') return 'CANCELED'
  return expiresAt.getTime() > Date.now() ? 'PENDING' : 'EXPIRED'
}

/** The invitation as the person it was sent to reads it; anyone else finds nothing (S10). */
export async function readReceived(tx: ReadTx, person: Person, invitationId: InvitationId) {
  const [row] = await tx
    .select({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      companyId: company.id,
      companyName: company.name,
      inviterName: user.name,
    })
    .from(invitation)
    .innerJoin(company, eq(invitation.organizationId, company.id))
    .innerJoin(user, eq(invitation.inviterId, user.id))
    .where(eq(invitation.id, invitationId))
  if (row === undefined || row.email !== person.email.toLowerCase()) {
    throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
  }
  return ReceivedInvitation.parse({
    id: row.id,
    company: { id: row.companyId, name: row.companyName },
    role: row.role,
    inviterName: row.inviterName,
    state: stateOf(Status.parse(row.status), row.expiresAt),
  })
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
    .select(pending)
    .from(invitation)
    .where(
      and(eq(invitation.organizationId, admitted.companyId), eq(invitation.attemptKey, attemptKey)),
    )
  return same
}

/** Room for one more open invitation: the address's own, about to be replaced, does not count. */
async function checkRoom(tx: CommandTx, admitted: Admitted, email: string): Promise<void> {
  const live = await counted(
    tx,
    sql`select count(*) from auth.invitation where company_id = ${admitted.companyId}
      and status = 'pending' and lower(email) <> ${email} and expires_at > statement_timestamp()`,
  )
  if (live >= INVITATION_CAPACITY) throw new Failure('INVITATIONS_FULL')
}

async function checkPace(tx: CommandTx, personId: string): Promise<void> {
  const recent = await counted(
    tx,
    sql`select count(*) from auth.invitation where inviter_id = ${personId}
      and created_at > statement_timestamp() - interval '60 seconds'`,
  )
  if (recent >= INVITATIONS_PER_MINUTE) throw new Failure('INVITATIONS_EXCEEDED')
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
        sql`lower(${invitation.email}) = ${email}`,
        eq(invitation.status, 'pending'),
      ),
    )
  return open
}

async function createdOf(tx: CommandTx, admitted: Admitted, invitationId: string) {
  const [row] = await tx.select(pending).from(invitation).where(eq(invitation.id, invitationId))
  const [named] = await tx
    .select({ name: company.name })
    .from(company)
    .where(eq(company.id, admitted.companyId))
  if (row === undefined || named === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'invitation not read' } })
  }
  return { invitation: pendingOf(row), mail: { companyName: named.name } }
}

/**
 * Invites an e-mail. The Hub owns the count of open invitations and the pace of each person, under
 * the company's lock; the plugin owns the roles, the member check and the row (K21r, K23).
 */
export function createInvitationCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: Invite) =>
    deps.libraryCommand(async (tx) => {
      const email = input.email.toLowerCase()
      const { headers } = input
      await lockCompany(tx, input.companyId)
      const personId = input.person.id
      const admitted = await admit({ tx, personId, companyId: input.companyId, action: 'invite' })
      await tx.execute(sql`select id from auth.user where id = ${personId} for no key update`)
      const same = await attemptOf(tx, admitted, input.attemptKey)
      if (same !== undefined) {
        if (same.email !== email || same.role !== input.role) {
          throw new Failure('IDEMPOTENCY_CONFLICT')
        }
        return { invitation: pendingOf(same), mail: undefined }
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
      return createdOf(tx, admitted, created.id)
    })
}

/** The e-mail of a link is the person's lock: two requests at once make one person and one link. */
function emailLock(email: string) {
  return sql`select pg_advisory_xact_lock(hashtextextended(${`conexus.person:${email}`}, 0))`
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
      const [found] = await tx
        .select({ email: invitation.email })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
      if (found === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'UNKNOWN' } })
      await tx.execute(emailLock(found.email))
      const [open] = await tx
        .select({ email: invitation.email })
        .from(invitation)
        .where(
          and(
            eq(invitation.id, input.invitationId),
            eq(invitation.status, 'pending'),
            sql`${invitation.expiresAt} > statement_timestamp()`,
          ),
        )
      if (open === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'CLOSED' } })
      const { internalAdapter } = await deps.auth.$context
      const known = await internalAdapter.findUserByEmail(open.email)
      const person =
        known?.user ??
        (await internalAdapter.createUser(
          { name: input.name, email: open.email },
          { method: 'admin' },
        ))
      if ((await internalAdapter.findCredentialAccount(person.id))?.password) {
        return { kind: 'HAS_PASSWORD' } as const
      }
      const given = await counted(
        tx,
        sql`select count(*) from auth.verification where value = ${person.id}
          and created_at > statement_timestamp() - ${LINK_PACE}`,
      )
      if (given > 0) throw new Failure('PASSWORD_LINKS_EXCEEDED')
      await forgetLinks(tx, person.id)
      const token = await linkTokenOf(() =>
        deps.auth.api.requestPasswordReset({ body: { email: open.email } }),
      )
      return { kind: 'LINK', token, email: Email.parse(open.email), name: person.name } as const
    })
}

/**
 * Accepts an invitation for the person it was sent to. Accepting again answers the same company;
 * the plugin decides the deadline, the state and the company's capacity (K21r, K23).
 */
export function acceptCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: { person: Person; headers: Headers; invitationId: InvitationId }) =>
    deps.libraryCommand(async (tx) => {
      const [found] = await tx
        .select({ companyId: invitation.organizationId, email: invitation.email })
        .from(invitation)
        .where(eq(invitation.id, input.invitationId))
      if (found === undefined || found.email !== input.person.email.toLowerCase()) {
        throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
      }
      await lockCompany(tx, found.companyId)
      const [joined] = await tx
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
      const already = joined?.status === 'accepted' && joined.memberId !== null
      if (!already) {
        const body = { invitationId: input.invitationId }
        await refusedAs(() => deps.auth.api.acceptInvitation({ headers: input.headers, body }), {
          INVITATION_NOT_FOUND: 'INVITATION_CLOSED',
          ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: 'COMPANY_FULL',
        })
      }
      const [row] = await tx
        .select({ id: company.id, name: company.name })
        .from(company)
        .where(eq(company.id, found.companyId))
      return { company: Company.parse(row), accepted: !already }
    })
}
