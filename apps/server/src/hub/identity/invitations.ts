import { RoleName } from '@conexus/app-contract'
import type { CompanyId, Person, PersonId } from '@conexus/hub-api'
import {
  AppAccessInvitation,
  Email,
  InvitationId,
  OPERATOR_INVITES_AS,
  PendingInvitation,
  ProjectId,
  Role,
} from '@conexus/hub-api'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { CompanyOperatorProof, CompanyProof } from './admission.ts'
import { isOperator } from './admission.ts'
import type { Auth } from './auth.ts'
import { organizationAdapter } from './auth.ts'
import type { Inviter } from './messages.ts'
import { company, invitation, user } from './tables.ts'

// The founder's number, step 4 answer 6: invitations per person and minute.
const INVITATION_PACE = { most: 10, window: sql`interval '1 minute'` }
export const Status = z.enum(['pending', 'accepted', 'rejected', 'canceled'])

/**
 * The library's invitation row, of either kind (step 18, I): the company's carries its role there;
 * an app's carries its Projeto and the role in the app, `role` being NULL in the library's column.
 */
export const pending = {
  id: invitation.id,
  email: invitation.email,
  kind: sql<string>`case when ${invitation.projectId} is null then 'COMPANY' else 'APP' end`.as(
    'kind',
  ),
  role: sql<string | null>`coalesce(${invitation.role}, ${invitation.appRole})`.as('role'),
  projectId: invitation.projectId,
  expiresAt: invitation.expiresAt,
  revision: invitation.revision,
}

/** Still open by the database's clock; the plugin's own check reads the application's. */
export const LIVE = sql`${invitation.expiresAt} > statement_timestamp()`
export const ADDRESS = sql`lower(${invitation.email})`
/** An invitation's Projeto as a key, the company's own being none, as the unique index reads it. */
export const PROJECT_KEY = sql`coalesce(${invitation.projectId}, '')`
/** The company's own invitations, the only ones its routes and the library's endpoints see. */
export const OF_COMPANY = sql`${invitation.projectId} is null`

const PendingBase = z.object({
  id: InvitationId,
  email: Email,
  expiresAt: z.date(),
  revision: z.number().int().nonnegative(),
})
/** An invitation into the company, with the role there. */
export const CompanyPendingRow = PendingBase.extend({ kind: z.literal('COMPANY'), role: Role })
/** An invitation to use a Projeto's app, with the role in it, none for an app without roles. */
export const AppPendingRow = PendingBase.extend({
  kind: z.literal('APP'),
  projectId: ProjectId,
  role: RoleName.nullable(),
})
export const PendingRow = z.discriminatedUnion('kind', [CompanyPendingRow, AppPendingRow])
export type PendingRow = z.infer<typeof PendingRow>
export type Invited =
  | Pick<z.infer<typeof CompanyPendingRow>, 'kind' | 'role'>
  | Pick<z.infer<typeof AppPendingRow>, 'kind' | 'projectId' | 'role'>

export function pendingOf(row: z.infer<typeof CompanyPendingRow>) {
  return PendingInvitation.parse({
    ...row,
    state: 'PENDING',
    expiresAt: row.expiresAt.toISOString(),
  })
}

export function appInvitationOf(row: z.infer<typeof AppPendingRow>) {
  return AppAccessInvitation.parse({ ...row, expiresAt: row.expiresAt.toISOString() })
}

/**
 * Inviting and accepting first lock the company, so the two serialize in one order and never
 * deadlock (C65, D23). The lock leaves foreign keys free: a new member still references the row.
 */
export async function lockCompany(tx: CommandTx, companyId: CompanyId): Promise<void> {
  await tx
    .select({ id: company.id })
    .from(company)
    .where(eq(company.id, companyId))
    .for('no key update')
}

/** A company route's scope: the company its address names, for the person of the session. */
export function companyScope(input: { person: Person; companyId: CompanyId }) {
  return { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id } as const
}

/** Counts what the person sent in every company, in the person's own scope (step 4, answer 6). */
export async function checkPace(
  database: Database,
  tx: CommandTx,
  personId: PersonId,
): Promise<void> {
  const recent = await database.asPerson(tx, (personal) =>
    personal.$count(
      invitation,
      and(
        eq(invitation.inviterId, personId),
        sql`${invitation.createdAt} > statement_timestamp() - ${INVITATION_PACE.window}`,
      ),
    ),
  )
  if (recent >= INVITATION_PACE.most) throw new Failure('INVITATIONS_EXCEEDED')
}

/** The operator invites as Conexus, a company's first owner or another (steps 4.2 and 6). */
export function inviterOf(admitted: CompanyProof, person: Person): Inviter {
  if (admitted.kind === 'COMPANY_OPERATOR') {
    return { kind: 'CONEXUS', firstOwner: admitted.firstOwner }
  }
  return { kind: 'MEMBER', name: person.name }
}

/** The inviter's row, held until commit: the pace counts their invitations one at a time. */
export async function lockedInviter(tx: CommandTx, personId: PersonId) {
  const [inviter] = await tx.select().from(user).where(eq(user.id, personId)).for('no key update')
  if (inviter === undefined) throw new Failure('SESSION_REQUIRED')
  return inviter
}

/** The library's refusals of a member's invitation, as the Hub's failures (step 4.1). */
export const INVITATION_REFUSALS = {
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION: 'MEMBER_EXISTS',
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE: 'INVITATION_ROLE_REFUSED',
} as const

/** A client's first owner is never an operator: Conexus is never a member (step 4.2). */
export async function checkOwnerNotOperator(tx: CommandTx, email: Email): Promise<void> {
  if (await isOperator(tx, email)) throw new Failure('CLIENT_OWNER_IS_OPERATOR')
}

/**
 * Cancels an invitation: a member's into the company through the plugin's endpoint, which checks
 * their permission; the operator's, who is no member, and an app's, which the plugin does not know,
 * through its adapter, the Hub's admission having decided (docs/reference/boundaries.md).
 */
export async function cancelThrough(
  auth: Auth,
  input: {
    admitted: CompanyProof
    headers: Headers
    invitationId: InvitationId
    kind: Invited['kind']
  },
): Promise<void> {
  const { invitationId } = input
  if (input.admitted.kind === 'MEMBER' && input.kind === 'COMPANY') {
    await auth.api.cancelInvitation({ headers: input.headers, body: { invitationId } })
    return
  }
  const adapter = await organizationAdapter(auth)
  await adapter.updateInvitation({ invitationId, status: 'canceled' })
}

/**
 * The operator invites one owner at a time, only as owner. An expired one the operator replaces is
 * not live, so it does not count.
 */
export async function checkOwnerInvitation(
  tx: CommandTx,
  input: { admitted: CompanyOperatorProof; email: Email; role: Role },
) {
  const { admitted } = input
  if (!OPERATOR_INVITES_AS.includes(input.role)) throw new Failure('INVITATION_ROLE_REFUSED')
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
  await checkOwnerNotOperator(tx, input.email)
}
