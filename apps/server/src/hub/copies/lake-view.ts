import type { CompanyId, ConnectionId, LakeRun } from '@conexus/hub-api'
import { LakeTableName, LakeTablesOfConnection, SourceTableId } from '@conexus/hub-api'
import { desc, eq } from 'drizzle-orm'
import type { Database } from '../../platform/database.ts'
import type { CopyConnection, CopySource } from '../connectors/public.ts'
import type { CompanyScope } from './lake-close.ts'
import { lakeOf } from './lake-close.ts'
import { runViewOf } from './lake-run-view.ts'
import { lakeCopy, lakeRun, lakeTable, lakeTableRun } from './tables.ts'

export type ViewDeps = { database: Database; source: CopySource }
export type OfConnection = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>
/** The connection a list is made for: its connector, name and declared tables. */
export type Listed = Omit<Extract<CopyConnection, { kind: 'FOUND' }>, 'kind'>

async function stored(database: Database, scope: CompanyScope, at: OfConnection) {
  return database.read(scope, async (tx) => {
    const lake = await lakeOf(tx, at.companyId)
    const [copy] = await tx
      .select({ interval: lakeCopy.interval, startDate: lakeCopy.startDate })
      .from(lakeCopy)
      .where(eq(lakeCopy.connectionId, at.connectionId))
    const named = await tx.select({ name: lakeTable.name }).from(lakeTable)
    const tables = await tx
      .select({ id: lakeTable.id, source: lakeTable.sourceTable, name: lakeTable.name })
      .from(lakeTable)
      .where(eq(lakeTable.connectionId, at.connectionId))
    const [run] = await tx
      .select()
      .from(lakeRun)
      .where(eq(lakeRun.connectionId, at.connectionId))
      .orderBy(desc(lakeRun.startedAt))
      .limit(1)
    const carried =
      run === undefined
        ? []
        : await tx
            .select({
              table: lakeTableRun.tableId,
              read: lakeTableRun.read,
              written: lakeTableRun.written,
              whole: lakeTableRun.whole,
            })
            .from(lakeTableRun)
            .where(eq(lakeTableRun.runId, run.id))
    return { lake, copy, taken: named.map((row) => row.name.toLowerCase()), tables, run, carried }
  })
}

function sumOf(carried: readonly { read: number; written: number }[]) {
  return {
    read: carried.reduce((sum, each) => sum + each.read, 0),
    written: carried.reduce((sum, each) => sum + each.written, 0),
  }
}

/**
 * The connection's tables as the window and the section read them: the kit's
 * declaration passed through the contract's schema, the dictionary's column counts (absent when it
 * does not answer), the company's names for each suggestion, and the copy's marks with the
 * last round. Read in the company's own login; the caller has admitted the person.
 */
export async function lakeTablesOf(
  deps: ViewDeps,
  scope: CompanyScope,
  at: OfConnection,
  found: Listed,
): Promise<LakeTablesOfConnection> {
  const { unavailable } = found
  const row = await stored(deps.database, scope, at)
  const lake = unavailable
    ? ({ kind: 'UNAVAILABLE', reason: unavailable } as const)
    : row.lake?.ready === true
      ? ({ kind: 'READY' } as const)
      : ({ kind: 'NOT_READY' } as const)
  const empty = {
    interval: row.copy?.interval ?? null,
    startDate: row.copy?.startDate ?? null,
    lastRun: null,
  }
  if (unavailable) return LakeTablesOfConnection.parse({ lake, ...empty, tables: [] })
  const dictionary = await deps.source.columns(at)
  const counts = dictionary.kind === 'READ' ? dictionary.columns : new Map()
  const marked = new Map(row.tables.map((table) => [table.source, table]))
  const carriedBy = new Map(row.carried.map((each) => [each.table, each]))
  const taken = new Set(row.taken)
  function lastRunOf(table: { id: string } | undefined): LakeRun | null {
    if (row.run === undefined) return null
    const own = table === undefined ? undefined : carriedBy.get(table.id)
    if (own !== undefined) return runViewOf(row.run, own)
    return runViewOf(row.run, {
      ...sumOf(table === undefined ? row.carried : []),
      whole: row.run.whole,
    })
  }
  const tables = found.tables.map((declaration) => {
    const source = SourceTableId.parse(declaration.source)
    const own = marked.get(source)
    return {
      source,
      label: declaration.label,
      description: declaration.description,
      group: declaration.group,
      mode: declaration.mode,
      columns: counts.get(source)?.length ?? null,
      limited: declaration.limited,
      copy:
        own === undefined
          ? {
              kind: 'UNMARKED' as const,
              suggested: LakeTableName.parse(
                deps.source.suggestedName({
                  connector: found.connector,
                  table: declaration,
                  connectionName: found.name,
                  taken: (name) => taken.has(name.toLowerCase()),
                }),
              ),
            }
          : {
              kind: 'MARKED' as const,
              name: LakeTableName.parse(own.name),
              lastRun: lastRunOf(own),
            },
    }
  })
  return LakeTablesOfConnection.parse({
    lake,
    ...empty,
    tables,
    lastRun: lastRunOf(undefined),
  })
}
