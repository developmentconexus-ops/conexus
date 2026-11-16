import type { CompanyId } from '@conexus/hub-api'
import { Role, RoleId } from '@conexus/hub-api'
import { asc, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { organizationRole } from './tables.ts'

export type CompanyRoleRow = Readonly<{ id: RoleId; role: Role }>

export async function companyRoleRows(tx: ReadTx, companyId: CompanyId): Promise<CompanyRoleRow[]> {
  const rows = await tx
    .select({ id: organizationRole.id, role: organizationRole.role })
    .from(organizationRole)
    .where(eq(organizationRole.organizationId, companyId))
    .orderBy(asc(organizationRole.id))
  return rows.map((row) => ({ id: RoleId.parse(row.id), role: Role.parse(row.role) }))
}
