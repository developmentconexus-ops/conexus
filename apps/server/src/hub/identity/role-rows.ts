import type { CompanyId } from '@conexus/hub-api'
import { FIXED_ROLES, isFixedRole, Role, RoleId } from '@conexus/hub-api'
import { asc, eq, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { member, organizationRole } from './tables.ts'

export type CompanyRoleRow = Readonly<{ id: RoleId; role: Role; label: string; members: number }>

/** How many people hold each role the company's members hold, by the role's stored name. */
export async function roleMembers(
  tx: ReadTx,
  companyId: CompanyId,
): Promise<ReadonlyMap<string, number>> {
  const used = await tx
    .select({ role: member.role, count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.organizationId, companyId))
    .groupBy(member.role)
  return new Map(used.map((one) => [one.role, one.count]))
}

export async function companyRoleRows(tx: ReadTx, companyId: CompanyId): Promise<CompanyRoleRow[]> {
  const rows = await tx
    .select({ id: organizationRole.id, role: organizationRole.role, label: organizationRole.label })
    .from(organizationRole)
    .where(eq(organizationRole.organizationId, companyId))
    .orderBy(asc(organizationRole.id))
  const members = await roleMembers(tx, companyId)
  return rows.map((row) => ({
    id: RoleId.parse(row.id),
    role: Role.parse(row.role),
    label: row.label,
    members: members.get(row.role) ?? 0,
  }))
}

/** The names of the roles a company holds: the four fixed, then its own by label. */
export async function roleNamesOf(tx: ReadTx, companyId: CompanyId): Promise<Role[]> {
  const own = await tx
    .select({ role: organizationRole.role })
    .from(organizationRole)
    .where(eq(organizationRole.organizationId, companyId))
    .orderBy(asc(organizationRole.label), asc(organizationRole.role))
  return [...FIXED_ROLES, ...own.map((row) => row.role).filter((role) => !isFixedRole(role))].map(
    (role) => Role.parse(role),
  )
}
