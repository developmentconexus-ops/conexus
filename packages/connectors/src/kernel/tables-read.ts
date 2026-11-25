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
import { called, FIRST_PAGE_ROWS, rowsAfter, UNREADABLE } from './tables-call.ts'
import { operationPage } from './tables-operation.ts'

type Discovered = Readonly<{
  found: ReadonlyMap<string, DiscoveredTable>
  failed: ReadonlyMap<string, TableReadFailed>
}>

async function discoveredOf(reach: TableReach, tables: ConnectorTables): Promise<Discovered> {
  const found = new Map<string, DiscoveredTable>()
  const failed = new Map<string, TableReadFailed>()
  const { discover } = tables
  if (discover === undefined) return { found, failed }
  const wanted = [
    ...new Set(
      tables.declared.flatMap((table) =>
        table.columns.kind === 'DISCOVERED' && table.source.kind === 'TABLE'
          ? [table.source.table]
          : [],
      ),
    ),
  ]
  for (let at = 0; at < wanted.length; at += discover.tables) {
    const batch = wanted.slice(at, at + discover.tables)
    const read = await called(reach, discover.operation, { tables: batch })
    if (read.kind === 'READ') for (const table of read.value.tables) found.set(table.table, table)
    else for (const table of batch) failed.set(table, read)
  }
  return { found, failed }
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

/**
 * The one discovery: what the window lists (U8) and what `tap --discover` writes (U4). Null columns:
 * the dictionary did not answer, and `failed` says why when the source stopped the call; without it
 * the dictionary has no such table.
 */
export async function discoverTables(reach: TableReach): Promise<
  readonly Readonly<{
    declaration: TableDeclaration
    columns: readonly TableColumn[] | null
    failed?: TableReadFailed
  }>[]
> {
  const { tables } = reach.connector
  if (tables === undefined) return []
  const { found, failed } = await discoveredOf(reach, tables)
  return tables.declared.map((declaration) => {
    const columns = columnsOf(declaration, found)
    const stop = columns === null ? failed.get(sourceOf(declaration)) : undefined
    return stop === undefined ? { declaration, columns } : { declaration, columns, failed: stop }
  })
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

/**
 * A CHANGED pass saves this ceiling, asked before its first page, not the latest value it read: a
 * row changed behind the key walk then comes again in the next pass (Airbyte's
 * `cursorUpperBoundQuery`). Columns without the mode's one are a source the copy cannot read.
 */
export async function tableCeiling(
  reach: TableReach & Readonly<{ table: TableDeclaration; columns: readonly TableColumn[] }>,
): Promise<Readonly<{ kind: 'CEILING'; value: string | null }> | TableReadFailed> {
  const { table, columns } = reach
  const { mode } = table
  const ceiling = reach.connector.tables?.ceiling
  if (table.source.kind !== 'TABLE' || ceiling === undefined || mode.kind !== 'CHANGED')
    throw new Error(`${table.name} is no CHANGED table of a source table`)
  const column = columns.find(({ name }) => name === mode.column)
  if (column === undefined) return UNREADABLE
  const read = await called(reach, ceiling, {
    table: table.source.table,
    column: { name: column.name, type: column.type },
  })
  return read.kind === 'READ' ? { kind: 'CEILING', value: read.value.value } : read
}

async function tablePage(ask: PageAsk, table: SourceTable): Promise<TablePageRead> {
  const { connector, columns, filter, after } = ask
  const readTable = connector.tables?.readTable
  if (readTable === undefined) throw new Error(`${connector.id} reads no source table`)
  const { page } = readTable
  const max = Math.min(page.rows, ask.ceiling ?? page.rows)
  const limit = Math.min(after?.rows ?? FIRST_PAGE_ROWS, max)
  const read = await called(ask, readTable.operation, {
    table,
    columns: columns.map(({ name, type }) => ({ name, type })),
    key: [...ask.table.key],
    filter,
    after: after?.kind === 'KEY' ? after.after : null,
    limit,
  })
  if (read.kind !== 'READ') return { ...read, rows: limit }
  if (read.value.rows.some((cells) => cells.length !== columns.length)) return UNREADABLE
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
    next: { kind: 'KEY', after: key, rows: rowsAfter(limit, rows, page.bytes, max) },
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
