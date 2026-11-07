import type { CompanyId } from '@conexus/hub-api'
import { FIXED_ROLES, isFixedRole, Role } from '@conexus/hub-api'
import { asc, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { organizationRole } from './tables.ts'

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
