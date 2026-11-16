import type { CompanyId } from '@conexus/hub-api'
import { fixedRole, ROLE_LABELS, Role, RoleId } from '@conexus/hub-api'
import { asc, eq, sql } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { member, organizationRole } from './tables.ts'

export type CompanyRoleRow = Readonly<{ id: RoleId; role: Role; label: string; members: number }>

async function membersByRole(tx: ReadTx, companyId: CompanyId): Promise<Map<string, number>> {
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
  const members = await membersByRole(tx, companyId)
  return rows.map((row) => ({
    id: RoleId.parse(row.id),
    role: Role.parse(row.role),
    label: row.label,
    members: members.get(row.role) ?? 0,
  }))
}

/** The owner and the administrator, who read every copy, with the label and how many people hold each. */
export async function readingAll(
  tx: ReadTx,
  companyId: CompanyId,
): Promise<{ role: Role; label: string; members: number }[]> {
  const members = await membersByRole(tx, companyId)
  return (['owner', 'admin'] as const).map((name) => ({
    role: fixedRole(name),
    label: ROLE_LABELS[name],
    members: members.get(name) ?? 0,
  }))
}
