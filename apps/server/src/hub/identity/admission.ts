import type { CompanyId, Email, PersonId } from '@conexus/hub-api'
import { Role } from '@conexus/hub-api'
import { defaultRoles } from 'better-auth/plugins/organization/access'
import { and, eq, notExists } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { storedAddress } from './auth.ts'
import { company, member, user } from './tables.ts'

const INVITE = { invitation: ['create'] } as const
type ActionRule = {
  by: 'MEMBER' | 'OPERATOR'
  locks: boolean
  statement?: typeof INVITE
  role?: Role
}

/**
 * Each action, who takes it and what it needs (security S6). A member's needs the statement the
 * plugin's role must allow, and none needs only the membership. The operator's is a fact of the
 * person, not a company role (S11). `invite` also admits the operator on a company with no member
 * yet, through `inviteOwner`, and only with the role it names. `locks` holds the row that decided
 * until the write commits (S8).
 */
const ACTIONS = {
  readCompany: { by: 'MEMBER', statement: undefined, locks: false },
  readInvitations: { by: 'MEMBER', statement: INVITE, locks: false },
  invite: { by: 'MEMBER', statement: INVITE, locks: true },
  operateClients: { by: 'OPERATOR', locks: false },
  registerClient: { by: 'OPERATOR', locks: true },
  correctClient: { by: 'OPERATOR', locks: true },
  deleteClient: { by: 'OPERATOR', locks: true },
  inviteOwner: { by: 'OPERATOR', locks: true, role: 'owner' },
} as const satisfies Record<string, ActionRule>

type Action = keyof typeof ACTIONS
export type CompanyAction = {
  [A in Action]: (typeof ACTIONS)[A]['by'] extends 'MEMBER' ? A : never
}[Action]
type InstallationAction = Exclude<Action, CompanyAction | 'inviteOwner'>

/** The one role the operator invites with: a client's first owner. */
export const OWNER_INVITER_ROLE = ACTIONS.inviteOwner.role

// The plugin's creator role: only a member who holds it may invite with it.
const CREATOR: Role = 'owner'
/** The admin plugin's administrator role, on the person, not a company (security S11). */
export const INSTALLATION_ADMINISTRATOR = 'admin'

function allows(role: Role, action: CompanyAction): boolean {
  const { statement } = ACTIONS[action]
  if (statement === undefined) return true
  return defaultRoles[role].authorize({ invitation: [...statement.invitation] }).success
}

let sealMember: (companyId: CompanyId, personId: PersonId, role: Role) => MemberProof
let sealOwnerInviter: (
  companyId: CompanyId,
  personId: PersonId,
  inviter: OperatorRow,
) => OwnerInviterProof
let sealOperator: (personId: PersonId, inviter: OperatorRow) => OperatorProof

/** The operator's row, read and held by the admission, which the plugin's adapter names as inviter. */
export type OperatorRow = typeof user.$inferSelect

// Each proof is nominal: its constructor is private and its private member keeps an object of the
// same shape from passing as one, so only this file makes a proof (security S7, code C16).

/** A member of the company, by the role the membership holds. */
export class MemberProof {
  readonly kind = 'MEMBER'
  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly role: Role
  declare private readonly nominal: never

  private constructor(companyId: CompanyId, personId: PersonId, role: Role) {
    this.companyId = companyId
    this.personId = personId
    this.role = role
  }

  static {
    sealMember = (companyId, personId, role) => new MemberProof(companyId, personId, role)
  }
}

/** The operator, on a company that has no member yet: it may invite the first owner. */
export class OwnerInviterProof {
  readonly kind = 'OWNER_INVITER'
  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly inviter: OperatorRow
  declare private readonly nominal: never

  private constructor(companyId: CompanyId, personId: PersonId, inviter: OperatorRow) {
    this.companyId = companyId
    this.personId = personId
    this.inviter = inviter
  }

  static {
    sealOwnerInviter = (companyId, personId, inviter) =>
      new OwnerInviterProof(companyId, personId, inviter)
  }
}

/** The operator, on the installation. */
export class OperatorProof {
  readonly kind = 'OPERATOR'
  readonly personId: PersonId
  readonly inviter: OperatorRow
  declare private readonly nominal: never

  private constructor(personId: PersonId, inviter: OperatorRow) {
    this.personId = personId
    this.inviter = inviter
  }

  static {
    sealOperator = (personId, inviter) => new OperatorProof(personId, inviter)
  }
}

export type CompanyProof = MemberProof | OwnerInviterProof

/** Whether a person's installation role makes them the operator. */
export function mayOperate(role: unknown): boolean {
  return role === INSTALLATION_ADMINISTRATOR
}

/** Whether the address belongs to the operator, as the library stores it. */
export async function isOperator(tx: ReadTx, email: Email): Promise<boolean> {
  const [row] = await tx
    .select({ role: user.role })
    .from(user)
    .where(eq(user.email, storedAddress(email)))
  return mayOperate(row?.role)
}

/** The person's row when their role makes them the operator, held until commit when `locks`. */
async function operatorRow(tx: ReadTx, personId: PersonId, locks: boolean) {
  const query = tx.select().from(user).where(eq(user.id, personId))
  const [row] = await (locks ? query.for('no key update') : query)
  return row !== undefined && mayOperate(row.role) ? row : undefined
}

/**
 * The operator on a company with no member, read under the company's lock the caller holds, so an
 * accept cannot add the first owner between this read and the invitation (security S8).
 */
async function admitOwnerInviter(tx: ReadTx, companyId: CompanyId, personId: PersonId) {
  const operator = await operatorRow(tx, personId, ACTIONS.inviteOwner.locks)
  if (operator === undefined) return undefined
  const [awaiting] = await tx
    .select({ id: company.id })
    .from(company)
    .where(
      and(
        eq(company.id, companyId),
        notExists(tx.select().from(member).where(eq(member.organizationId, company.id))),
      ),
    )
  return awaiting === undefined ? undefined : sealOwnerInviter(companyId, personId, operator)
}

type CompanyInput = { tx: ReadTx; personId: PersonId; companyId: CompanyId }

/** The person's role in the company, or nothing for an outsider and an unknown company. */
async function membershipOf(input: CompanyInput, action: CompanyAction) {
  const query = input.tx
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, input.companyId), eq(member.userId, input.personId)))
  const [row] = await (ACTIONS[action].locks ? query.for('share') : query)
  return row === undefined ? undefined : Role.parse(row.role)
}

function admitMember(input: CompanyInput, role: Role, action: CompanyAction): MemberProof {
  if (!allows(role, action)) throw new Failure('NOT_FOUND', { details: { reason: 'FORBIDDEN' } })
  return sealMember(input.companyId, input.personId, role)
}

/**
 * Reads the person's membership and decides by its role. An outsider, an unknown company and a
 * role without the action get the same not-found; only the log tells them apart (security S10).
 */
export async function admit(input: CompanyInput & { action: CompanyAction }): Promise<MemberProof> {
  const role = await membershipOf(input, input.action)
  if (role === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
  return admitMember(input, role, input.action)
}

/**
 * Admits an invitation's issuer: a member who may invite, or the operator while the company awaits
 * its first owner (`inviteOwner`). Anyone else gets `admit`'s not-found.
 */
export async function admitInviter(input: CompanyInput): Promise<CompanyProof> {
  const role = await membershipOf(input, 'invite')
  if (role !== undefined) return admitMember(input, role, 'invite')
  const inviter = await admitOwnerInviter(input.tx, input.companyId, input.personId)
  if (inviter === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
  return inviter
}

/** Admits the operator on the installation, by the role read in the caller's transaction (S11). */
export async function admitOperator(input: {
  tx: ReadTx
  personId: PersonId
  action: InstallationAction
}): Promise<OperatorProof> {
  const operator = await operatorRow(input.tx, input.personId, ACTIONS[input.action].locks)
  if (operator === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'FORBIDDEN' } })
  return sealOperator(input.personId, operator)
}

/**
 * The roles an admitted proof may invite with: the plugin keeps its creator role to its holders,
 * and the operator invites only a first owner.
 */
export function mayInviteAs(admitted: CompanyProof): Role[] {
  switch (admitted.kind) {
    case 'MEMBER':
      if (!allows(admitted.role, 'invite')) return []
      return Role.options.filter((role) => role !== CREATOR || admitted.role === CREATOR)
    case 'OWNER_INVITER':
      return [OWNER_INVITER_ROLE]
    default:
      return admitted satisfies never
  }
}
