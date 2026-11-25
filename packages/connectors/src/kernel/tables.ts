import { z } from 'zod'
import type { Operation, OperationId } from './operation.ts'
import { OperationId as OperationIdSchema } from './operation.ts'

/** The suggested lake name after the connector prefix: Portuguese, snake_case (NT2; a suggestion, founder 2026-11-23). */
export const TableName = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,39}$/)
  .brand('TableName')
export type TableName = z.infer<typeof TableName>

/** A table of the source as the source names it: `TGFCAB`. */
export const SourceTable = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/)
  .brand('SourceTable')
export type SourceTable = z.infer<typeof SourceTable>

/** A column's type in the lake, the one map every connector's discovery and declaration use (T.36). */
export const TableColumnType = z.enum([
  'text',
  'numeric',
  'bigint',
  'date',
  'timestamp',
  'boolean',
  'json',
  'binary',
])
export type TableColumnType = z.infer<typeof TableColumnType>

/** A column of the source as the source names it; a name starting with `_` is the engine's (T.41). */
export const SourceColumn = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,59}$/)

/** What a numeric column's source declares of its decimal: Oracle `NUMBER(p, s)`; absent when it declares no scale (`FLOAT`, bare `NUMBER`). */
export const DeclaredDecimal = z
  .object({ precision: z.int().min(1).max(38), scale: z.int().min(0).max(38) })
  .refine(({ precision, scale }) => scale <= precision)
export type DeclaredDecimal = z.infer<typeof DeclaredDecimal>

export const TableColumn = z.object({
  name: SourceColumn,
  type: TableColumnType,
  description: z.string().max(200).nullable(),
  decimal: DeclaredDecimal.optional(),
})
export type TableColumn = z.infer<typeof TableColumn>

type Scalar = string | number | boolean

export type TableSource =
  | Readonly<{ kind: 'TABLE'; table: SourceTable }>
  | Readonly<{ kind: 'OPERATION'; operation: OperationId; input: Readonly<Record<string, Scalar>> }>

/** How a table is read each run, fixed by the connector (0080; NK:177752). */
export type TableMode =
  // rows past the saved point of a column that only grows; registry: master data, which the start date never limits (NKH:134107)
  | Readonly<{ kind: 'CHANGED'; column: string; registry: boolean }>
  // rereads the last `reread` months and replaces them; the start date limits its months
  | Readonly<{ kind: 'WINDOW'; column: string; step: 'MONTH'; reread: number }>
  // the whole table every run; the start date never limits it (singer-sdk _state.py:145-150)
  | Readonly<{ kind: 'FULL' }>

/** The one owner of what a start date limits (T.43): a CHANGED table that is not a registry, and a WINDOW table. */
export function startDateLimits(mode: TableMode): boolean {
  switch (mode.kind) {
    case 'CHANGED':
      return !mode.registry
    case 'WINDOW':
      return true
    case 'FULL':
      return false
    default:
      return mode satisfies never
  }
}

export type DeclaredColumn = TableColumn & Readonly<{ path: string }>

type TableColumns =
  // the dictionary's, less `exclude`; the type comes from the dictionary (T.36)
  | Readonly<{ kind: 'DISCOVERED'; exclude: readonly string[] }>
  // path: the field in an OPERATION row; the column itself in a TABLE source
  | Readonly<{ kind: 'DECLARED'; columns: readonly DeclaredColumn[] }>

export type TableDeclaration = Readonly<{
  name: TableName // 'notas' -> suggested sankhya_notas
  label: string
  description: string // one or two sentences; the window, Dados and the agent read it
  group: string // a key of the connector's subjects
  source: TableSource
  key: readonly string[] // the source's key columns, in page order
  mode: TableMode
  history: boolean // true keeps every version in raw; default false (decision A)
  meanings?: Readonly<Record<string, 'NFE_XML'>> // metadata only, for the step that reads the XML in rows
  columns: TableColumns
}>

export const DiscoveredTable = z.object({
  table: SourceTable,
  description: z.string().nullable(),
  columns: z.array(TableColumn).min(1),
})
export type DiscoveredTable = z.infer<typeof DiscoveredTable>

const Month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)

export const TableFilter = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ALL') }),
  // the saved point, as the source writes it, or the start date
  z.object({ kind: z.literal('SINCE'), column: SourceColumn, after: z.string().min(1).max(64) }),
  // '2026-11', or an out-of-calendar month the count found
  z.object({ kind: z.literal('MONTH'), column: SourceColumn, month: Month }),
])
export type TableFilter = z.infer<typeof TableFilter>

/** One page asked of a TABLE source: the columns in order, after the last key read, at most `limit` rows. */
export const TablePageInput = z.object({
  table: SourceTable,
  columns: z.array(TableColumn.pick({ name: true, type: true })).min(1),
  key: z.array(SourceColumn).min(1),
  filter: TableFilter,
  after: z.array(z.string()).min(1).nullable(),
  limit: z.int().min(1),
})
export type TablePageInput = z.infer<typeof TablePageInput>

/** A page of a TABLE source: each row's cells in the order of the input's columns, as the type's canonical text; fewer rows than asked is the last page. */
export const TablePage = z.object({ rows: z.array(z.array(z.string().nullable())) })
export type TablePage = z.infer<typeof TablePage>

/** Where the next page starts, and how many rows it asks: as many as fit the page's bytes at the width of the rows just read (`rowsAfter`). */
export const TablePosition = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('KEY'), after: z.array(z.string()).min(1), rows: z.int().min(1) }),
  z.object({ kind: z.literal('OFFSET'), offset: z.int().min(0), rows: z.int().min(1) }),
  z.object({
    kind: z.literal('CURSOR'),
    cursor: z.string().min(1).max(4000),
    at: z.iso.datetime(),
    rows: z.int().min(1),
  }),
])
export type TablePosition = z.infer<typeof TablePosition>

export const OPERATION_PAGE_BYTES = 1_048_576

export const CeilingInput = z.object({
  table: SourceTable,
  column: TableColumn.pick({ name: true, type: true }),
})
export type CeilingInput = z.infer<typeof CeilingInput>

export type ConnectorTables = Readonly<{
  declared: readonly TableDeclaration[]
  // tables: how many the source's dictionary answers whole in one call
  discover?: Readonly<{
    operation: Operation<{ tables: SourceTable[] }, { tables: DiscoveredTable[] }, 'read'>
    tables: number
  }>
  months?: Operation<{ table: SourceTable; column: string }, { months: string[] }, 'read'> // required by a WINDOW table
  ceiling?: Operation<CeilingInput, { value: string | null }, 'read'> // required by a CHANGED table of a TABLE source
  // required by a TABLE source, with its page's rows and bytes
  readTable?: Readonly<{
    operation: Operation<TablePageInput, TablePage, 'read'>
    page: Readonly<{ rows: number; bytes: number }>
  }>
}>

type TableDefinition = Omit<TableDeclaration, 'name' | 'source'> & {
  name: string
  source:
    | Readonly<{ kind: 'TABLE'; table: string }>
    | Readonly<{ kind: 'OPERATION'; operation: string; input: Readonly<Record<string, Scalar>> }>
}

/** Takes each table's name and source as plain strings and brands them; throws on a bad one. */
export function defineTables(
  tables: Omit<ConnectorTables, 'declared'> & { declared: readonly TableDefinition[] },
): ConnectorTables {
  const declared = tables.declared.map(
    ({ name, source, ...rest }): TableDeclaration =>
      Object.freeze({
        ...rest,
        name: TableName.parse(name),
        source:
          source.kind === 'TABLE'
            ? { kind: 'TABLE' as const, table: SourceTable.parse(source.table) }
            : { ...source, operation: OperationIdSchema.parse(source.operation) },
      }),
  )
  return Object.freeze({ ...tables, declared: Object.freeze(declared) })
}

/** The source as the wire and the catalog's `table_name` write it: the table, or the operation's id. */
export function sourceOf(table: TableDeclaration): string {
  return table.source.kind === 'TABLE' ? table.source.table : table.source.operation
}

const LAKE_NAME_MAX = 60
/** The longest connector prefix a lake name takes: `mercado_livre_` has 14. */
export const PREFIX_MAX = 20

/** `mercado-livre` gives `mercado_livre_`: the connector's id with `-` as `_`. */
export function tablePrefixOf(connector: string): string {
  return `${connector.replaceAll('-', '_')}_`
}

/** The one owner of the lake name rule: the prefix plus the name, at most 60 (T.16). */
export function lakeNameOf(prefix: string, name: string): string {
  const joined = `${prefix}${name}`
  if (joined.length > LAKE_NAME_MAX)
    throw new RangeError(`A lake name has at most ${LAKE_NAME_MAX}`)
  return joined
}

/** A connection's name as a part of a lake name: lower case, no accent, `_` between words. */
function slugOf(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * The kit's name with the connector prefix; when another table of the company has it, the
 * connection's name goes between them, cut so the whole fits in 60 (T.16); when that one is taken
 * too, or the connection's name has no letter to give, a number ends it.
 */
export function suggestedLakeName(
  input: Readonly<{
    connector: string
    table: TableName
    connectionName: string
    taken: (name: string) => boolean
  }>,
): string {
  const prefix = tablePrefixOf(input.connector)
  const plain = lakeNameOf(prefix, input.table)
  if (!input.taken(plain)) return plain
  const room = LAKE_NAME_MAX - prefix.length - input.table.length - 1
  const part = slugOf(input.connectionName).slice(0, Math.max(room, 0)).replace(/_+$/, '')
  const named = part === '' ? plain : lakeNameOf(prefix, `${part}_${input.table}`)
  if (!input.taken(named)) return named
  for (let count = 2; ; count++) {
    const suffix = `_${count}`
    const free = `${named.slice(0, LAKE_NAME_MAX - suffix.length)}${suffix}`
    if (!input.taken(free)) return free
  }
}

/** What a source answers when it stops a table's read: the code, never the body. */
export const TABLE_SOURCE_FAILURES = [
  'COPY_SOURCE_NEEDS_REAUTH',
  'COPY_SOURCE_REFUSED',
  'COPY_SOURCE_UNREACHABLE',
  'COPY_SOURCE_UNREADABLE',
] as const
export type TableSourceFailure = Readonly<{
  code: (typeof TABLE_SOURCE_FAILURES)[number]
  system: Readonly<{ status: number; code: string | null; message: string | null }> | null
}>

/**
 * A stopped read. `waitMs`: the wait a provider that answered 429 asked for, null otherwise.
 * `smaller`: a 5xx or an ended deadline, which a page of fewer rows can clear; a 429 or a dead
 * network cannot. `rows`: what the stopped page asked, null when it asked none. `bodyBytes`: the
 * size of the answer's body, null when there was none; never the body (security S41).
 */
export type TableReadFailed = Readonly<{
  kind: 'FAILED'
  waitMs: number | null
  smaller: boolean
  rows: number | null
  bodyBytes: number | null
}> &
  TableSourceFailure

/** Why a sender gave no answer: the network failed, its deadline ended, or the answer was not one the kit can read. */
export type TableSendFailure = Readonly<{ kind: 'UNREACHABLE' | 'TIMED_OUT' | 'UNREADABLE' }>
