import type { CompanyId } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { project } from './tables.ts'

/** Every Projeto of the company, marked for deletion or not: what a removal of the company reaches. */
export async function projectIdsOf(tx: ReadTx, companyId: CompanyId): Promise<ProjectId[]> {
  const rows = await tx
    .select({ id: project.id })
    .from(project)
    .where(eq(project.companyId, companyId))
  return rows.map(({ id }) => ProjectId.parse(id))
}
