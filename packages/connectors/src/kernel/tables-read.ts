import type {
  ConnectorTables,
  DiscoveredTable,
  SourceTable,
  TableColumn,
  TableDeclaration,
  TableReadFailed,
} from './tables.ts'
import { sourceOf } from './tables.ts'
import type { PageAsk, TablePageRead, TableReach } from './tables-call.ts'
import { called, pageOf, rowsAfter, UNREADABLE } from './tables-call.ts'
import { operationPage } from './tables-operation.ts'

/** The tables a connector declares by kind of columns, each `DISCOVERED` one asked of the hook in batches. */
const DISCOVER_BATCH = 8

async function discoveredOf(
  reach: TableReach,
  tables: ConnectorTables,
): Promise<ReadonlyMap<string, DiscoveredTable>> {
  const found = new Map<string, DiscoveredTable>()
  const { discover } = tables
  if (discover === undefined) return found
  const wanted = [
    ...new Set(
      tables.declared.flatMap((table) =>
        table.columns.kind === 'DISCOVERED' && table.source.kind === 'TABLE'
          ? [table.source.table]
          : [],
      ),
    ),
  ]
  for (let at = 0; at < wanted.length; at += DISCOVER_BATCH) {
    const read = await called(reach, discover, { tables: wanted.slice(at, at + DISCOVER_BATCH) })
    if (read.kind !== 'READ') continue
    for (const table of read.value.tables) found.set(table.table, table)
  }
  return found
}

function columnsOf(
  table: TableDeclaration,
  found: ReadonlyMap<string, DiscoveredTable>,
): readonly TableColumn[] | null {
  if (table.columns.kind === 'DECLARED')
    return table.columns.columns.map(({ name, type, description }) => ({
      name,
      type,
      description,
    }))
  const { exclude } = table.columns
  const discovered = found.get(sourceOf(table))
  return discovered === undefined
    ? null
    : discovered.columns.filter((column) => !exclude.includes(column.name))
}

/** The one discovery: what the window lists (U8) and what `tap --discover` writes (U4); null columns: the dictionary did not answer. */
export async function discoverTables(
  reach: TableReach,
): Promise<
  readonly Readonly<{ declaration: TableDeclaration; columns: readonly TableColumn[] | null }>[]
> {
  const { tables } = reach.connector
  if (tables === undefined) return []
  const found = await discoveredOf(reach, tables)
  return tables.declared.map((declaration) => ({
    declaration,
    columns: columnsOf(declaration, found),
  }))
}

/** The months a WINDOW table has rows in, as the source counts them: out-of-calendar ones included. */
export async function tableMonths(
  reach: TableReach & Readonly<{ table: TableDeclaration }>,
): Promise<Readonly<{ kind: 'MONTHS'; months: readonly string[] }> | TableReadFailed> {
  const { table } = reach
  const months = reach.connector.tables?.months
  if (table.mode.kind !== 'WINDOW' || table.source.kind !== 'TABLE' || months === undefined)
    throw new Error(`${table.name} is no window of a source table`)
  const read = await called(reach, months, { table: table.source.table, column: table.mode.column })
  return read.kind === 'READ' ? { kind: 'MONTHS', months: read.value.months } : read
}

async function tablePage(ask: PageAsk, table: SourceTable): Promise<TablePageRead> {
  const { connector, columns, filter, after } = ask
  const readTable = connector.tables?.readTable
  if (readTable === undefined) throw new Error(`${connector.id} reads no source table`)
  const page = pageOf(connector)
  const limit = after?.rows ?? page.rows
  const read = await called(ask, readTable, {
    table,
    columns: columns.map(({ name, type }) => ({ name, type })),
    key: [...ask.table.key],
    filter,
    after: after?.kind === 'KEY' ? after.after : null,
    limit,
  })
  if (read.kind !== 'READ') return read
  const rows = read.value.rows.map((cells) =>
    Object.fromEntries(columns.map(({ name }, at) => [name, cells[at] ?? null])),
  )
  if (rows.length < limit) return { kind: 'PAGE', rows, next: null }
  const last = rows.at(-1)
  const key = ask.table.key.map((name) => last?.[name])
  if (!key.every((cell): cell is string => typeof cell === 'string')) return UNREADABLE
  return {
    kind: 'PAGE',
    rows,
    next: { kind: 'KEY', after: key, rows: rowsAfter(limit, rows, page.bytes) },
  }
}

/**
 * One page of any declared table: a TABLE source through the connector's `readTable`, an OPERATION
 * source through the operation's `list` paging. Each row is keyed by the source's column names, each
 * cell its type's canonical text; `next` is null on the last page.
 */
export function readTablePage(ask: PageAsk): Promise<TablePageRead> {
  const { source } = ask.table
  return source.kind === 'TABLE' ? tablePage(ask, source.table) : operationPage(ask, source)
}
