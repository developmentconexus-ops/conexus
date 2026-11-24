import type { Operation } from './operation.ts'
import type {
  ConnectorTables,
  DeclaredColumn,
  TableColumnType,
  TableDeclaration,
} from './tables.ts'
import { PREFIX_MAX, SourceColumn, TABLE_PAGE_DEFAULT, TableName, tablePrefixOf } from './tables.ts'

/** The engine's columns start with `_` (the `_sdc_*` and the 3a's), so a declared one never does (T.41). */
function assertColumn(name: string, table: TableName): void {
  if (name.startsWith('_'))
    throw new Error(`A column of ${table} starts with "_", which the engine owns: ${name}`)
  SourceColumn.parse(name)
}

const DATED: ReadonlySet<TableColumnType> = new Set(['date', 'timestamp'])

/** The columns the key and the mode name, which must be among the table's columns. */
function namedOf(table: TableDeclaration): readonly string[] {
  return [...table.key, ...(table.mode.kind === 'FULL' ? [] : [table.mode.column])]
}

function assertDeclaredColumns(table: TableDeclaration, columns: readonly DeclaredColumn[]): void {
  if (columns.length === 0) throw new Error(`${table.name} declares no column`)
  for (const { name } of columns) assertColumn(name, table.name)
  const names = new Set(columns.map(({ name }) => name))
  if (names.size !== columns.length) throw new Error(`${table.name} repeats a column`)
  for (const name of namedOf(table))
    if (!names.has(name)) throw new Error(`${table.name} names ${name}, not one of its columns`)
  if (table.mode.kind === 'WINDOW') {
    const { column } = table.mode
    const type = columns.find(({ name }) => name === column)?.type
    if (type === undefined || !DATED.has(type))
      throw new Error(`${table.name} windows by ${column}, which is no date`)
  }
}

function assertSource(connector: Declaring, tables: ConnectorTables, table: TableDeclaration) {
  const { source, mode, columns } = table
  if (source.kind === 'TABLE') {
    if (tables.readTable === undefined)
      throw new Error(`${table.name} reads a source table, and ${connector.id} has no readTable`)
    if (mode.kind === 'WINDOW' && tables.months === undefined)
      throw new Error(`${table.name} windows by month, and ${connector.id} counts no months`)
    return
  }
  if (columns.kind !== 'DECLARED')
    throw new Error(`${table.name} reads an operation, so it declares its columns`)
  const operation = connector.operations.find((each) => each.id === source.operation)
  const list = operation?.list
  if (list === undefined) throw new Error(`${table.name} reads ${source.operation}, no list read`)
  const taken = Object.keys(source.input).filter((name) =>
    [
      ...(list.paging.kind === 'NONE' ? [] : [list.paging.limit]),
      ...(list.paging.kind === 'OFFSET' ? [list.paging.offset] : []),
      ...(list.paging.kind === 'CURSOR'
        ? [list.paging.cursor, ...Object.keys(list.paging.start)]
        : []),
      ...(list.changed === null ? [] : [list.changed.input]),
    ].includes(name),
  )
  if (taken.length > 0)
    throw new Error(`${table.name} fixes ${taken.join(', ')}, which the paging fills`)
  if (mode.kind === 'WINDOW') throw new Error(`${table.name} windows an operation`)
  if (mode.kind === 'CHANGED') {
    const path = columns.columns.find(({ name }) => name === mode.column)?.path
    if (list.changed === null || path !== list.changed.field)
      throw new Error(
        `${table.name} follows ${mode.column}, which ${source.operation} cannot filter`,
      )
  }
}

/** Two tables of one source share only key columns: a discovered one shares every column. */
function assertSourcesApart(tables: ConnectorTables): void {
  const bySource = new Map<string, TableDeclaration[]>()
  for (const table of tables.declared) {
    const source = table.source.kind === 'TABLE' ? table.source.table : JSON.stringify(table.source)
    bySource.set(source, [...(bySource.get(source) ?? []), table])
  }
  for (const [source, same] of bySource) if (same.length > 1) assertApart(source, same)
}

function assertApart(source: string, same: readonly TableDeclaration[]): void {
  const seen = new Set<string>()
  for (const table of same) {
    if (table.columns.kind === 'DISCOVERED')
      throw new Error(`${source} is read twice, once with every column`)
    for (const { name } of table.columns.columns) {
      if (seen.has(name) && !table.key.includes(name))
        throw new Error(`${source} is read twice with ${name}, not of the key`)
      seen.add(name)
    }
  }
}

function assertPage(page: Readonly<{ rows: number; bytes: number }>): void {
  if (!Number.isSafeInteger(page.rows) || page.rows < 1) throw new Error('A page asks rows')
  if (!Number.isSafeInteger(page.bytes) || page.bytes < 1) throw new Error('A page has bytes')
}

/** The part of a connector its tables' declaration reads. */
type Declaring = Readonly<{
  id: string
  subjects: Readonly<Record<string, string>>
  operations: readonly Operation<unknown, unknown>[]
  tables?: ConnectorTables
}>

function assertTable(connector: Declaring, tables: ConnectorTables, table: TableDeclaration): void {
  TableName.parse(table.name)
  if (!(table.group in connector.subjects))
    throw new Error(`${table.name} is grouped under ${table.group}, no subject of ${connector.id}`)
  if (table.key.length === 0 || new Set(table.key).size !== table.key.length)
    throw new Error(`${table.name} has no key, or repeats a key column`)
  const { mode, columns } = table
  if (mode.kind === 'WINDOW' && (!Number.isSafeInteger(mode.reread) || mode.reread < 1))
    throw new Error(`${table.name} rereads no month`)
  assertSource(connector, tables, table)
  if (columns.kind === 'DECLARED') {
    assertDeclaredColumns(table, columns.columns)
    return
  }
  if (tables.discover === undefined)
    throw new Error(`${table.name} discovers its columns, and ${connector.id} has no discovery`)
  for (const name of namedOf(table))
    if (columns.exclude.includes(name))
      throw new Error(`${table.name} excludes ${name}, which it names`)
}

/** The tables' declaration as `defineConnector` checks it at import: what needs no double to refuse. */
export function assertTablesDeclared(connector: Declaring): void {
  const { tables } = connector
  if (tables === undefined) return
  if (tablePrefixOf(connector.id).length > PREFIX_MAX)
    throw new Error(`The prefix of ${connector.id} passes ${PREFIX_MAX}`)
  assertPage(tables.page ?? TABLE_PAGE_DEFAULT)
  const names = tables.declared.map(({ name }) => name)
  if (new Set(names).size !== names.length)
    throw new Error(`${connector.id} suggests one lake name twice`)
  for (const table of tables.declared) assertTable(connector, tables, table)
  assertSourcesApart(tables)
}
