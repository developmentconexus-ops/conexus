import type { CompanyId } from '@conexus/hub-api'
import { eq, sql } from 'drizzle-orm'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import { companyProjectName, NeonProjectId } from '../../platform/neon.ts'
import type { OperatorProof } from '../identity/public.ts'
import { companyDatabase, project } from './tables.ts'

type Of = { admitted: OperatorProof; companyId: CompanyId }

/** Whether the company has a database row, a claim or a ready one: what decides if its deletion needs Neon. */
export async function hasCompanyDatabase(tx: ReadTx, input: Of): Promise<boolean> {
  const [row] = await tx
    .select({ companyId: companyDatabase.companyId })
    .from(companyDatabase)
    .where(eq(companyDatabase.companyId, input.companyId))
  return row !== undefined
}

/**
 * Frees the company's database in Neon, with no transaction open (data D22): the project the row
 * records and every project with the company's exact name, which a cut reply may have left. A
 * project Neon no longer has counts as deleted. A claim still alive may be making one, so nothing
 * is deleted until it ends; any answer short of done leaves the deletion to be retried.
 */
export async function releaseCompanyDatabase(
  deps: { database: Database; neon: NeonProjects; log: FailureLog },
  input: Of,
): Promise<void> {
  const scope = {
    kind: 'OPERATOR',
    personId: input.admitted.personId,
    companyId: input.companyId,
  } as const
  const row = await deps.database.read(scope, async (tx) => {
    const [found] = await tx
      .select({
        neonProjectId: companyDatabase.neonProjectId,
        held: sql<boolean>`${companyDatabase.claimedUntil} > statement_timestamp()`,
      })
      .from(companyDatabase)
      .where(eq(companyDatabase.companyId, input.companyId))
    return found
  })
  if (row === undefined) return
  if (row.held) throw new Failure('CLIENT_DELETION_PENDING')
  const named = await deps.neon.find(companyProjectName(input.companyId))
  if (named.kind !== 'DONE') throw new Failure('CLIENT_DELETION_PENDING')
  const recorded = row.neonProjectId === null ? [] : [NeonProjectId.parse(row.neonProjectId)]
  for (const id of new Set([...recorded, ...named.value])) {
    if ((await deps.neon.delete(id)).kind !== 'DONE') throw new Failure('CLIENT_DELETION_PENDING')
    deps.log.info({ companyId: input.companyId, neonProjectId: id }, 'COMPANY_DATABASE_DELETED')
  }
}

/** Removes the company's Projects and database rows, in the deletion's last transaction. */
export async function deleteCompanyProjects(tx: CommandTx, input: Of): Promise<void> {
  await tx.delete(project).where(eq(project.companyId, input.companyId))
  await tx.delete(companyDatabase).where(eq(companyDatabase.companyId, input.companyId))
}
