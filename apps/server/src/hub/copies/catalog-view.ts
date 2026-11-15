import type { CatalogTable, CompanyId, CopyId, ProjectId } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { copySources, endedRuns, projectCopyRows } from './list.ts'
import type { TableRead } from './read-table.ts'
import { readCopyTable } from './read-table.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope, parsedCopy, shownOf } from './store.ts'
import { copy } from './tables.ts'

type Place = 'ALL' | { projectId: ProjectId }

/** Every copy of the company, or the ones a Projeto has released, with its stored definition. */
async function copiesOf(tx: ReadTx, companyId: CompanyId, only: Place) {
  if (only !== 'ALL') {
    const rows = await projectCopyRows(tx, { companyId, projectId: only.projectId })
    return rows.filter(({ granted }) => granted).map(({ copy: stored }) => stored)
  }
  const rows = await tx.select().from(copy).where(eq(copy.companyId, companyId)).orderBy(copy.name)
  return rows.map(parsedCopy)
}

/** The copies a place reads, as the catalog states them; admits nobody: the caller did, in its transaction (code C8). */
export async function catalogTables(
  tx: ReadTx,
  input: { companyId: CompanyId; only: Place },
): Promise<CatalogTable[]> {
  const { companyId, only } = input
  const copies = await copiesOf(tx, companyId, only)
  const ids: CopyId[] = copies.map(({ id }) => id)
  const sources = await copySources(tx, companyId, ids)
  const runs = await endedRuns(
    tx,
    copies.flatMap(({ lastRunId }) => (lastRunId === null ? [] : [lastRunId])),
  )
  return copies.flatMap((stored) => {
    const named = sources.get(stored.id) ?? []
    // A copy with no live source is ending (leave.ts endedSourceless).
    if (named.length === 0) return []
    const shown = shownOf(stored.connectorId, stored.definition, stored.columnState)
    return [
      {
        name: stored.name,
        label: stored.label,
        description: shown.description ?? stored.label,
        columns: shown.columns,
        kept: {
          kind: 'COPY' as const,
          connections: named.map(({ connection }) => ConnectionId.parse(connection.id)),
          source: shown.source,
          lastRun: runs.get(stored.id) ?? null,
        },
      },
    ]
  })
}

/** One page of a copy's table by its name; admits nobody: the catalog decided the place reads it. */
export async function tableRowsByName(
  deps: CopiesDeps,
  input: { companyId: CompanyId; name: string; limit: number; signal: AbortSignal },
): Promise<TableRead | { kind: 'NO_COPY' }> {
  const { companyId, name, limit, signal } = input
  const [row] = await deps.database.read(companyScope(companyId), (tx) =>
    tx
      .select()
      .from(copy)
      .where(and(eq(copy.companyId, companyId), eq(copy.name, name))),
  )
  if (row === undefined) return { kind: 'NO_COPY' }
  return readCopyTable(deps, { companyId, stored: parsedCopy(row), limit, signal })
}
