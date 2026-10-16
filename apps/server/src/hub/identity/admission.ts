import type { CompanyId, PersonId } from '@conexus/hub-api'
import { Role } from '@conexus/hub-api'
import { defaultRoles } from 'better-auth/plugins/organization/access'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { member } from './tables.ts'

/**
 * Each action on a company and the statement it needs from the plugin's roles (security S6).
 * `readCompany` needs only the membership.
 */
const ACTIONS = {
  readCompany: undefined,
  readInvitations: { invitation: ['create'] },
  invite: { invitation: ['create'] },
} as const

export type CompanyAction = keyof typeof ACTIONS

// The plugin's creator role: only a member who holds it may invite with it.
const CREATOR: Role = 'owner'
/** The admin plugin's administrator role, on the person, not a company (security S11). */
export const INSTALLATION_ADMINISTRATOR = 'admin'

function allows(role: Role, action: CompanyAction): boolean {
  const statement = ACTIONS[action]
  if (statement === undefined) return true
  return defaultRoles[role].authorize({ invitation: [...statement.invitation] }).success
}

let grant: (companyId: CompanyId, personId: PersonId, role: Role) => Admitted

/** The proof that a person may act on a company; only `admit` makes one (security S7, code C16). */
export class Admitted {
  static {
    grant = (companyId, personId, role) => new Admitted(companyId, personId, role)
  }

  readonly companyId: CompanyId
  readonly personId: PersonId
  readonly role: Role
  // A private member makes the type nominal: an object of the same shape is not a proof.
  declare private readonly nominal: never

  private constructor(companyId: CompanyId, personId: PersonId, role: Role) {
    this.companyId = companyId
    this.personId = personId
    this.role = role
  }
}

/**
 * Reads the person's membership and decides by its role. An outsider, an unknown company and a
 * role without the action get the same not-found; only the log tells them apart (security S10).
 */
export async function admit(input: {
  tx: ReadTx
  personId: PersonId
  companyId: CompanyId
  action: CompanyAction
}): Promise<Admitted> {
  const [row] = await input.tx
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, input.companyId), eq(member.userId, input.personId)))
  if (row === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'OUTSIDER' } })
  const role = Role.parse(row.role)
  if (!allows(role, input.action)) {
    throw new Failure('NOT_FOUND', { details: { reason: 'FORBIDDEN' } })
  }
  return grant(input.companyId, input.personId, role)
}

/** The roles an admitted member may invite with: the plugin keeps its creator role to itself. */
export function mayInviteAs(admitted: Admitted): Role[] {
  if (!allows(admitted.role, 'invite')) return []
  return Role.options.filter((role) => role !== CREATOR || admitted.role === CREATOR)
}

export function mayCreateCompanies(role: unknown): boolean {
  return role === INSTALLATION_ADMINISTRATOR
}
