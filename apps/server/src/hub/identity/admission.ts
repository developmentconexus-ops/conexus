import type { CompanyId, Email, PersonId } from '@conexus/hub-api'
import { OPERATOR_INVITES_AS, Role } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { COMPANY_ROLES, storedAddress } from './auth.ts'
import { company, member, user } from './tables.ts'

const INVITE = { invitation: ['create'] } as const
const REMOVE = { member: ['delete'] } as const
const CHANGE_ROLE = { member: ['update'] } as const
const CREATE_PROJECT = { project: ['create'] } as const
const DELETE_PROJECT = { project: ['delete'] } as const
type ActionRule = {
  by: 'MEMBER' | 'COMPANY' | 'OPERATOR'
  locks: boolean
  statement?:
    | typeof INVITE
    | typeof REMOVE
    | typeof CHANGE_ROLE
    | typeof CREATE_PROJECT
    | typeof DELETE_PROJECT
}

/**
 * Each action, who takes it and what it needs (security S6). A member's needs the statement the
 * plugin's role must allow, and none needs only the membership. The operator's is a fact of the
 * person, not a company role (S11). A `COMPANY` action also admits the operator on that company,
 * with or without a member, as `COMPANY_OPERATOR`: it invites only with `OPERATOR_INVITES_AS`,
 * and the rank table decides what it may do to a member. `locks` holds the row that decided until
 * the write commits (S8).
 */
const ACTIONS = {
  readCompany: { by: 'MEMBER', statement: undefined, locks: false },
  readProjects: { by: 'MEMBER', statement: undefined, locks: false },
  createProject: { by: 'MEMBER', statement: CREATE_PROJECT, locks: true },
  deleteProject: { by: 'MEMBER', statement: DELETE_PROJECT, locks: true },
  readMembers: { by: 'COMPANY', statement: undefined, locks: false },
  readInvitations: { by: 'COMPANY', statement: INVITE, locks: false },
  invite: { by: 'COMPANY', statement: INVITE, locks: true },
  removeMember: { by: 'COMPANY', statement: REMOVE, locks: true },
  leaveCompany: { by: 'COMPANY', statement: undefined, locks: true },
  changeRole: { by: 'COMPANY', statement: CHANGE_ROLE, locks: true },
  operateClients: { by: 'OPERATOR', locks: false },
  registerClient: { by: 'OPERATOR', locks: true },
  correctClient: { by: 'OPERATOR', locks: true },
  deleteClient: { by: 'OPERATOR', locks: true },
} as const satisfies Record<string, ActionRule>

type Action = keyof typeof ACTIONS
type ActionBy<By extends ActionRule['by']> = {
  [A in Action]: (typeof ACTIONS)[A]['by'] extends By ? A : never
}[Action]
export type MemberAction = ActionBy<'MEMBER'>
export type CompanyAction = ActionBy<'COMPANY'>
type InstallationAction = ActionBy<'OPERATOR'>

// The plugin's creator role: only a member who holds it may invite with it.
const CREATOR: Role = 'owner'
/** The admin plugin's administrator role, on the person, not a company (security S11). */
export const INSTALLATION_ADMINISTRATOR = 'admin'

type RoleAction = MemberAction | CompanyAction

/** Whether the role takes the action, read from the roles the plugin is given (auth.ts). */
export function allows(role: Role, action: RoleAction): boolean {
  const { statement } = ACTIONS[action]
  if (statement === undefined) return true
  return COMPANY_ROLES[role].authorize(statement).success
}

/** Who acts on a member: the role of a member of the company, or the operator, who has none. */
export type Actor = Role | 'OPERATOR'

/**
 * Whether the actor may take a member of role `target` out of the company, or, when `next` names a
 * role, change it to that (founder, step 6: 1A and the answer on who changes whom). The owner and
 * the operator may do both to anyone; the administrator only to administrators and members, and
 * never gives the owner role; the member to no one. A person may always take themselves out: the
 * caller decides that, for the rank table knows no one by name.
 */
export function rankAllows(actor: Actor, target: Role, next?: Role): boolean {
  switch (actor) {
    case 'OPERATOR':
    case 'owner':
      return true
    case 'admin':
      return target !== 'owner' && next !== 'owner'
    case 'member':
      return false
    default:
      return actor satisfies never
  }
}

let sealMember: (companyId: CompanyId, personId: PersonId, role: Role) => MemberProof
let sealCompanyOperator: (
  companyId: CompanyId,
  personId: PersonId,
  inviter: OperatorRow,
  firstOwner: boolean,
) => CompanyOperatorProof
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

/**
 * The operator on a company, whether it has members or not and without being one: it acts as an
 * owner on the company's people and invites owners. `firstOwner` says the company has no member yet.
 */
export class CompanyOperatorProof {
  readonly kind = 'COMPANY_OPERATOR'
  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly inviter: OperatorRow
  readonly firstOwner: boolean
  declare private readonly nominal: never

  private constructor(
    companyId: CompanyId,
    personId: PersonId,
    inviter: OperatorRow,
    firstOwner: boolean,
  ) {
    this.companyId = companyId
    this.personId = personId
    this.inviter = inviter
    this.firstOwner = firstOwner
  }

  static {
    sealCompanyOperator = (companyId, personId, inviter, firstOwner) =>
      new CompanyOperatorProof(companyId, personId, inviter, firstOwner)
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

export type CompanyProof = MemberProof | CompanyOperatorProof

/** The rank the proof acts with on the company's people. */
export function actorOf(admitted: CompanyProof): Actor {
  return admitted.kind === 'MEMBER' ? admitted.role : 'OPERATOR'
}

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
 * The operator on an existing company, read under the company's lock the caller holds, so an accept
 * cannot add the first owner between this read and the write (security S8).
 */
async function admitCompanyOperator(input: CompanyInput, action: CompanyAction) {
  const operator = await operatorRow(input.tx, input.personId, ACTIONS[action].locks)
  if (operator === undefined) return undefined
  const [found] = await input.tx
    .select({ id: company.id })
    .from(company)
    .where(eq(company.id, input.companyId))
  if (found === undefined) return undefined
  const [anyone] = await input.tx
    .select({ id: member.id })
    .from(member)
    .where(eq(member.organizationId, input.companyId))
    .limit(1)
  return sealCompanyOperator(input.companyId, input.personId, operator, anyone === undefined)
}

type CompanyInput = { tx: ReadTx; personId: PersonId; companyId: CompanyId }

/** The person's role in the company, or nothing for an outsider and an unknown company. */
async function membershipOf(input: CompanyInput, action: RoleAction) {
  const query = input.tx
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, input.companyId), eq(member.userId, input.personId)))
  const [row] = await (ACTIONS[action].locks ? query.for('share') : query)
  return row === undefined ? undefined : Role.parse(row.role)
}

function admitMember(input: CompanyInput, role: Role, action: RoleAction): MemberProof {
  if (!allows(role, action)) throw new Failure('NOT_FOUND', { details: { reason: 'FORBIDDEN' } })
  return sealMember(input.companyId, input.personId, role)
}

/**
 * A company the Central is deleting admits no one, the operator included: the same not-found as
 * any other, with the reason only in the log (security S10). The mark is read after the caller's
 * company lock, so a deletion that has marked the company is seen (S8).
 */
async function refuseIfDeleting(input: CompanyInput): Promise<void> {
  const [row] = await input.tx
    .select({ since: company.deletingSince })
    .from(company)
    .where(eq(company.id, input.companyId))
  if (row?.since != null) throw new Failure('NOT_FOUND', { details: { reason: 'DELETING' } })
}

/**
 * Reads the person's membership and decides by its role. An outsider, an unknown company and a
 * role without the action get the same not-found; only the log tells them apart (security S10).
 */
export async function admit(input: CompanyInput & { action: MemberAction }): Promise<MemberProof> {
  const role = await membershipOf(input, input.action)
  if (role === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
  const admitted = admitMember(input, role, input.action)
  await refuseIfDeleting(input)
  return admitted
}

/**
 * Admits a member who may take the action, or the operator on the company. Anyone else gets
 * `admit`'s not-found.
 */
export async function admitCompany(
  input: CompanyInput & { action: CompanyAction },
): Promise<CompanyProof> {
  const role = await membershipOf(input, input.action)
  const admitted =
    role === undefined
      ? await admitCompanyOperator(input, input.action)
      : admitMember(input, role, input.action)
  if (admitted === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
  await refuseIfDeleting(input)
  return admitted
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
 * and the operator invites only an owner.
 */
export function mayInviteAs(admitted: CompanyProof): Role[] {
  switch (admitted.kind) {
    case 'MEMBER':
      if (!allows(admitted.role, 'invite')) return []
      return Role.options.filter((role) => role !== CREATOR || admitted.role === CREATOR)
    case 'COMPANY_OPERATOR':
      return [...OPERATOR_INVITES_AS]
    default:
      return admitted satisfies never
  }
}
