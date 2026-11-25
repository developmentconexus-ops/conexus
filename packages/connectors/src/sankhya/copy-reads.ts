import { z } from 'zod'
import type { Answered, ProviderAnswer } from '../kernel/operation.ts'
import { defineOperation } from '../kernel/operation.ts'
import type {
  CeilingInput as CeilingInputType,
  DiscoveredTable,
  SourceTable as SourceTableType,
  TableColumn,
  TableColumnType,
  TablePage,
  TablePageInput,
} from '../kernel/tables.ts'
import {
  CeilingInput,
  DiscoveredTable as DiscoveredTableSchema,
  SourceColumn,
  SourceTable,
  TablePageInput as TablePageInputSchema,
} from '../kernel/tables.ts'
import { gatewayAnswer } from './answers.ts'
import { pageQueryRequest, QueriedCells, QueriedRows } from './door.ts'

const SCHEMA = "SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA')"
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/

function quoted(text: string): string {
  return `'${text.replaceAll("'", "''")}'`
}

/** A cut of the gateway (`burstLimit`) is no page: the rows it kept are not all the rows asked. */
function whole<O>(answer: ProviderAnswer, read: Answered<O & { completo: boolean }>): Answered<O> {
  if (read.kind !== 'OK' || read.value.completo) return read
  return {
    kind: 'UNREADABLE',
    native: { status: answer.status, code: null, message: null, body: null },
  }
}

/** TDDCAM.TIPCAMPO (the Sankhya data dictionary) with ALL_TAB_COLUMNS.DATA_TYPE: Oracle's large types first (T.36). */
const LARGE: Readonly<Record<string, TableColumnType>> = {
  CLOB: 'text',
  NCLOB: 'text',
  LONG: 'text',
  BLOB: 'binary',
  RAW: 'binary',
  'LONG RAW': 'binary',
}
const TIPCAMPO: Readonly<Record<string, TableColumnType>> = {
  I: 'bigint',
  F: 'numeric',
  S: 'text',
  C: 'text',
  T: 'text',
  D: 'date',
  H: 'timestamp',
  B: 'binary',
}
/** ALL_TAB_COLUMNS.DATA_TYPE for a column the dictionary does not list: an Oracle DATE keeps the hour. */
const ORACLE: Readonly<Record<string, TableColumnType>> = {
  DATE: 'timestamp',
  NUMBER: 'numeric',
  FLOAT: 'numeric',
  VARCHAR2: 'text',
  NVARCHAR2: 'text',
  CHAR: 'text',
  NCHAR: 'text',
}

function oracleType(dataType: string): TableColumnType | undefined {
  return dataType.startsWith('TIMESTAMP') ? 'timestamp' : ORACLE[dataType]
}

const DESCRIPTION_MAX = 200

/** A column's type by the map, or text with the dictionary's type in its description when the map does not know it. */
function columnOf(row: z.infer<typeof DictionaryRow>): TableColumn {
  const type =
    LARGE[row.DATA_TYPE] ??
    (row.TIPCAMPO === null ? oracleType(row.DATA_TYPE) : TIPCAMPO[row.TIPCAMPO])
  const said = row.DESCRCAMPO ?? row.NOMECAMPO
  if (type !== undefined)
    return { name: row.NOMECAMPO, type, description: said.slice(0, DESCRIPTION_MAX) }
  const note = ` (tipo ${row.TIPCAMPO ?? '?'}, ${row.DATA_TYPE})`
  return {
    name: row.NOMECAMPO,
    type: 'text' as const,
    description: `${said.slice(0, DESCRIPTION_MAX - note.length)}${note}`,
  }
}

const DictionaryRow = z.object({
  NOMETAB: z.string(),
  DESCRTAB: z.string().nullable(),
  NOMECAMPO: z.string(),
  DESCRCAMPO: z.string().nullable(),
  TIPCAMPO: z.string().nullable(),
  DATA_TYPE: z.string(),
})

/** The dictionary's rows, a table's fields in a row each, as the tables they describe. */
const Dictionary = z
  .object({ linhas: z.array(DictionaryRow), completo: z.boolean() })
  .transform(({ linhas, completo }) => {
    const tables = Map.groupBy(linhas, (row) => row.NOMETAB)
    return {
      completo,
      tables: [...tables].map(([table, rows]) => ({
        table,
        description: rows[0]?.DESCRTAB?.slice(0, DESCRIPTION_MAX) ?? null,
        columns: rows.map(columnOf),
      })),
    }
  })
  .pipe(z.object({ completo: z.boolean(), tables: z.array(DiscoveredTableSchema) }))

/**
 * Every physical column of each table, as tap-oracle reads `all_tab_columns`, with the dictionary's
 * description and type when it lists the column: an installation's dictionary can miss one, as a
 * real TSIEMP misses DHALTER. A calculated field exists on the screen alone, so it has no column; a
 * table the dictionary lacks is absent.
 */
function dictionarySql(tables: readonly SourceTableType[]): string {
  return [
    'SELECT A.TABLE_NAME AS NOMETAB, T.DESCRTAB, A.COLUMN_NAME AS NOMECAMPO, C.DESCRCAMPO, C.TIPCAMPO, A.DATA_TYPE',
    'FROM ALL_TAB_COLUMNS A JOIN TDDTAB T ON T.NOMETAB = A.TABLE_NAME',
    'LEFT JOIN TDDCAM C ON C.NOMETAB = A.TABLE_NAME AND C.NOMECAMPO = A.COLUMN_NAME',
    `WHERE A.OWNER = ${SCHEMA} AND A.TABLE_NAME IN (${tables.map(quoted).join(', ')})`,
    'ORDER BY A.TABLE_NAME, A.COLUMN_ID',
  ].join(' ')
}

const DiscoverInput = z.object({ tables: z.array(SourceTable).min(1) })

export const descobrirTabelas = defineOperation({
  id: 'descobrirTabelas',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary: 'Lê do dicionário do Sankhya (TDDTAB, TDDCAM) a descrição e as colunas de cada tabela.',
  label: 'Dicionário',
  input: DiscoverInput,
  output: z.object({ tables: z.array(DiscoveredTableSchema) }),
  probe: () => ({ tables: [SourceTable.parse('TGFCAB')] }),
  request: ({ tables }) => pageQueryRequest(dictionarySql(tables)),
  answer: (answer): Answered<{ tables: DiscoveredTable[] }> =>
    whole(answer, gatewayAnswer(answer, QueriedRows.pipe(Dictionary))),
})

const MonthsInput = z.object({ table: SourceTable, column: SourceColumn })

const Months = z
  .object({ linhas: z.array(z.object({ MES: z.string().regex(MONTH) })), completo: z.boolean() })
  .transform(({ linhas, completo }) => ({ months: linhas.map(({ MES }) => MES), completo }))

/** The months a date column has rows in, as Oracle counts them: an out-of-calendar year (0208, 2109) is a month like another (A0D). */
export const contarMeses = defineOperation({
  id: 'contarMeses',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary: 'Conta por mês as linhas de uma coluna de data de uma tabela do Sankhya.',
  label: 'Meses',
  input: MonthsInput,
  output: z.object({ months: z.array(z.string().regex(MONTH)) }),
  probe: () => ({ table: SourceTable.parse('TCBLAN'), column: 'REFERENCIA' }),
  request: ({ table, column }) => {
    const month = `TO_CHAR(T.${column}, 'YYYY-MM')`
    return pageQueryRequest(
      `SELECT ${month} AS MES FROM ${table} T WHERE T.${column} IS NOT NULL GROUP BY ${month} ORDER BY MES`,
    )
  },
  answer: (answer) => whole(answer, gatewayAnswer(answer, QueriedRows.pipe(Months))),
})

const NUMBER = /^-?\d+(\.\d+)?$/
const DAY = /^(\d{4}-\d{2}-\d{2})$/
const STAMP = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})$/

/** A value as an Oracle literal of its column's type: the key read last, the saved point, or the start date. */
function literalOf(type: TableColumnType, text: string): string {
  switch (type) {
    case 'bigint':
    case 'numeric':
      if (!NUMBER.test(text)) throw new Error(`Not a number: ${text}`)
      return text
    case 'date':
    case 'timestamp': {
      const [, day, time] = STAMP.exec(text) ?? DAY.exec(text) ?? []
      if (day === undefined) throw new Error(`Not a date: ${text}`)
      return time === undefined
        ? `TO_DATE(${quoted(day)}, 'YYYY-MM-DD')`
        : `TO_DATE(${quoted(`${day} ${time}`)}, 'YYYY-MM-DD HH24:MI:SS')`
    }
    case 'text':
      return quoted(text)
    case 'boolean':
    case 'json':
    case 'binary':
      throw new Error(`A ${type} column orders no page`)
    default:
      return type satisfies never
  }
}

/** The first day of a month and of the next one: `0208-12` gives `0208-12-01` and `0209-01-01`. */
function monthBounds(month: string): readonly [string, string] {
  const [year = 0, at = 1] = month.split('-').map(Number)
  const next = at === 12 ? [year + 1, 1] : [year, at + 1]
  return [firstDay(year, at), firstDay(next[0] ?? year, next[1] ?? 1)]
}

function firstDay(year: number, month: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`
}

/** A column as the page reads it: a date or a timestamp as its canonical text, in Oracle (no zone: the installation's hour). */
function selected({ name, type }: CeilingInputType['column']): string {
  if (type === 'date') return `TO_CHAR(T.${name}, 'YYYY-MM-DD') AS ${name}`
  if (type === 'timestamp') return `TO_CHAR(T.${name}, 'YYYY-MM-DD"T"HH24:MI:SS') AS ${name}`
  return `T.${name}`
}

/** After the last key read: the first key column's range first, so Oracle walks the primary key's index (P3, `STOPKEY`). */
function afterKey(input: TablePageInput, after: readonly string[]): string {
  const types = new Map(input.columns.map(({ name, type }) => [name, type]))
  const values = input.key.map((name, at) => literalOf(types.get(name) ?? 'text', after[at] ?? ''))
  const branches = input.key.map((name, at) =>
    [
      ...input.key.slice(0, at).map((before, i) => `T.${before} = ${values[i]}`),
      `T.${name} > ${values[at]}`,
    ].join(' AND '),
  )
  return `T.${input.key[0]} >= ${values[0]} AND (${branches.map((branch) => `(${branch})`).join(' OR ')})`
}

function filterOf(input: TablePageInput): string | null {
  const { filter } = input
  if (filter.kind === 'ALL') return null
  const type = input.columns.find((column) => column.name === filter.column)?.type ?? 'date'
  if (filter.kind === 'SINCE') return `T.${filter.column} >= ${literalOf(type, filter.after)}`
  const [first, next] = monthBounds(filter.month)
  return `T.${filter.column} >= ${literalOf('date', first)} AND T.${filter.column} < ${literalOf('date', next)}`
}

/** One page of a table by its key, in key order, at most `limit` rows. */
function pageSql(input: TablePageInput): string {
  const where = [
    filterOf(input),
    input.after === null ? null : afterKey(input, input.after),
  ].filter((part) => part !== null)
  return [
    `SELECT ${input.columns.map(selected).join(', ')} FROM ${input.table} T`,
    ...(where.length === 0 ? [] : [`WHERE ${where.join(' AND ')}`]),
    `ORDER BY ${input.key.map((name) => `T.${name}`).join(', ')}`,
    `OFFSET 0 ROWS FETCH NEXT ${input.limit} ROWS ONLY`,
  ].join(' ')
}

/**
 * A cell as its canonical text: the DbExplorer answers a number as a JSON number (one past a
 * double's digits as its source text, `numbers: 'EXACT'`), a text, a CLOB and the dates the page
 * converted as text. A BLOB comes as base64 text in the double; its real form is not measured.
 */
const Cell = z.union([z.string(), z.number().transform(String), z.null()])

const Page = z.object({ linhas: z.array(z.array(Cell)), completo: z.boolean() })

const Ceiling = z
  .object({ linhas: z.array(z.array(Cell)).max(1), completo: z.boolean() })
  .transform(({ linhas, completo }) => ({ value: linhas[0]?.[0] ?? null, completo }))

export const maiorAlteracao = defineOperation({
  id: 'maiorAlteracao',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary: 'Lê o maior valor da coluna de alteração de uma tabela do Sankhya.',
  label: 'Maior alteração',
  input: CeilingInput,
  output: z.object({ value: z.string().nullable() }),
  probe: (): CeilingInputType => ({
    table: SourceTable.parse('TGFCAB'),
    column: { name: 'DTALTER', type: 'timestamp' },
  }),
  request: ({ table, column }) =>
    pageQueryRequest(
      `SELECT ${selected(column)} FROM (SELECT MAX(T.${column.name}) AS ${column.name} FROM ${table} T) T`,
    ),
  answer: (answer) => whole(answer, gatewayAnswer(answer, QueriedCells.pipe(Ceiling))),
})

export const lerTabela = defineOperation({
  id: 'lerTabela',
  class: 'read' as const,
  subject: 'porta',
  idempotent: true,
  summary: 'Lê uma página de uma tabela do Sankhya pela chave, com o filtro da cópia.',
  label: 'Página da tabela',
  input: TablePageInputSchema,
  output: z.object({ rows: z.array(z.array(z.string().nullable())) }),
  probe: (): TablePageInput => ({
    table: SourceTable.parse('TSIEMP'),
    columns: [{ name: 'CODEMP', type: 'bigint' }],
    key: ['CODEMP'],
    filter: { kind: 'ALL' },
    after: null,
    limit: 1,
  }),
  request: (input) => pageQueryRequest(pageSql(input)),
  answer: (answer): Answered<TablePage> => {
    const read = whole(answer, gatewayAnswer(answer, QueriedCells.pipe(Page)))
    return read.kind === 'OK' ? { kind: 'OK', value: { rows: read.value.linhas } } : read
  },
})
