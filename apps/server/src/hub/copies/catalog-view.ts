import type {
  CatalogTable,
  CompanyId,
  ConnectionId,
  ConnectionState,
  CopyId,
  CopySource,
  KeptSource,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import { and, eq, inArray } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import { copySources, endedRuns, projectCopyRows } from './list.ts'
import type { TableRead } from './read-table.ts'
import { readCopyTable } from './read-table.ts'
import type { ReaderLogin } from './readers.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope, parsedCopy, shownOf } from './store.ts'
import { copy } from './tables.ts'

type Place = 'ALL' | { projectId: ProjectId } | { copies: readonly CopyId[] }

/** Every copy of the company, the ones a Projeto has released, or the ones named, with its stored definition. */
async function copiesOf(tx: ReadTx, companyId: CompanyId, only: Place) {
  if (only === 'ALL') {
    const rows = await tx
      .select()
      .from(copy)
      .where(eq(copy.companyId, companyId))
      .orderBy(copy.name)
    return rows.map(parsedCopy)
  }
  if ('projectId' in only) {
    const rows = await projectCopyRows(tx, { companyId, projectId: only.projectId })
    return rows.filter(({ granted }) => granted).map(({ copy: stored }) => stored)
  }
  if (only.copies.length === 0) return []
  const rows = await tx
    .select()
    .from(copy)
    .where(and(eq(copy.companyId, companyId), inArray(copy.id, [...only.copies])))
    .orderBy(copy.name)
  return rows.map(parsedCopy)
}

/** A connection the copy was made from, named when the place was given it, the connector alone when not. */
function keptSource(
  { connection }: CopySource,
  given: ReadonlyMap<ConnectionId, ConnectionState>,
): KeptSource {
  const state = given.get(connection.id)
  return state === undefined
    ? { kind: 'NOT_GIVEN', connector: connection.connector }
    : { kind: 'NAMED', connection, state }
}

/** The copies a place reads, as the catalog states them; admits nobody: the caller did, in its transaction (code C8). */
export async function catalogTables(
  tx: ReadTx,
  input: {
    companyId: CompanyId
    only: Place
    given: ReadonlyMap<ConnectionId, ConnectionState>
  },
): Promise<CatalogTable[]> {
  const { companyId, only, given } = input
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
          sources: named.map((one) => keptSource(one, given)),
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
  input: {
    companyId: CompanyId
    personId: PersonId
    name: string
    limit: number
    signal: AbortSignal
    reader: ReaderLogin
  },
): Promise<TableRead | { kind: 'NO_COPY' }> {
  const { companyId, name } = input
  const [row] = await deps.database.read(companyScope(companyId), (tx) =>
    tx
      .select()
      .from(copy)
      .where(and(eq(copy.companyId, companyId), eq(copy.name, name))),
  )
  if (row === undefined) return { kind: 'NO_COPY' }
  return readCopyTable(deps, { ...input, stored: parsedCopy(row) })
}
