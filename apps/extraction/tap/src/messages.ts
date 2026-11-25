import type {
  TableColumn,
  TableColumnType,
  TableDeclaration,
  TableSourceFailure,
} from '@conexus/connectors'
import { sourceOf, startDateLimits, TableFilter, TablePosition } from '@conexus/connectors'
import { z } from 'zod'

type ColumnSchema = Readonly<{
  type: readonly string[]
  format?: string
  contentEncoding?: 'base64'
  precision?: number
  scale?: number
  description?: string
}>
export type JsonSchema = Readonly<{
  type: 'object'
  properties: Readonly<Record<string, ColumnSchema>>
}>

export type SingerMessage =
  | Readonly<{ type: 'SCHEMA'; stream: string; schema: JsonSchema; key_properties: string[] }>
  | Readonly<{ type: 'RECORD'; stream: string; record: Record<string, unknown>; version?: number }>
  | Readonly<{ type: 'STATE'; value: TapState }>
  | Readonly<{ type: 'ACTIVATE_VERSION'; stream: string; version: number }>

export type TapFailure = TableSourceFailure & Readonly<{ table: string }>

const Pass = z.object({
  version: z.int().min(0),
  filters: z.array(TableFilter).min(1),
  at: z.int().min(0),
  after: TablePosition.nullable(),
  point: z.string().nullable(),
  ceiling: z.int().min(1).optional(),
})
export type Pass = z.infer<typeof Pass>

const Bookmark = z.object({ replication_key_value: z.string().optional(), pass: Pass.optional() })
export type Bookmark = z.infer<typeof Bookmark>

export const TapState = z.object({ bookmarks: z.record(z.string(), Bookmark).default({}) })
export type TapState = z.infer<typeof TapState>

function cellJson(type: TableColumnType, cell: string | null): string {
  if (cell === null) return 'null'
  if (type === 'bigint' && /^-?\d+$/.test(cell)) return cell
  if (type === 'boolean' && (cell === 'true' || cell === 'false')) return cell
  if (type === 'json') return JSON.stringify(z.unknown().parse(JSON.parse(cell)))
  return JSON.stringify(cell)
}

export function lineOf(message: SingerMessage): string {
  return JSON.stringify(message)
}

export function recordLine(
  a: Readonly<{
    stream: string
    columns: readonly TableColumn[]
    row: Readonly<Record<string, string | null>>
    version: number
  }>,
): string {
  const cells = a.columns.map(
    ({ name, type }) =>
      `${JSON.stringify(name.toLowerCase())}:${cellJson(type, a.row[name] ?? null)}`,
  )
  return `{"type":"RECORD","stream":${JSON.stringify(a.stream)},"record":{${cells.join(',')}},"version":${a.version}}`
}

const TYPES: Readonly<Record<TableColumnType, Omit<ColumnSchema, 'description'>>> = {
  text: { type: ['string', 'null'] },
  numeric: { type: ['string', 'null'], format: 'x-singer.decimal' },
  bigint: { type: ['integer', 'null'] },
  date: { type: ['string', 'null'], format: 'date' },
  timestamp: { type: ['string', 'null'], format: 'date-time' },
  boolean: { type: ['boolean', 'null'] },
  json: { type: ['object', 'array', 'string', 'number', 'boolean', 'null'] },
  binary: { type: ['string', 'null'], contentEncoding: 'base64' },
}

/** A decimal the source declares travels as `precision` and `scale` beside `x-singer.decimal`, the keys singer-sdk reads (`sql/connector.py:376`). */
function columnSchema({ type, description, decimal }: TableColumn): ColumnSchema {
  const typed = decimal === undefined ? TYPES[type] : { ...TYPES[type], ...decimal }
  return description === null ? typed : { ...typed, description }
}

export function schemaOf(columns: readonly TableColumn[]): JsonSchema {
  const properties = columns.map((column) => [column.name.toLowerCase(), columnSchema(column)])
  return { type: 'object', properties: Object.fromEntries(properties) }
}

export function catalogEntry(
  a: Readonly<{ stream: string; table: TableDeclaration; columns: readonly TableColumn[] }>,
) {
  const { table, columns } = a
  const key = table.key.map((name) => name.toLowerCase())
  const followed =
    table.mode.kind === 'FULL' ? {} : { 'replication-key': table.mode.column.toLowerCase() }
  return {
    tap_stream_id: a.stream,
    stream: a.stream,
    table_name: sourceOf(table),
    key_properties: key,
    schema: schemaOf(columns),
    metadata: [
      {
        breadcrumb: [],
        metadata: {
          selected: false,
          'table-key-properties': key,
          'forced-replication-method': table.mode.kind === 'FULL' ? 'FULL_TABLE' : 'INCREMENTAL',
          ...followed,
          'conexus-mode': table.mode,
          'conexus-limited': startDateLimits(table.mode),
          'conexus-history': table.history,
          'conexus-label': table.label,
          'conexus-description': table.description,
          'conexus-meanings': table.meanings ?? {},
        },
      },
      ...columns.map(({ name }) => ({
        breadcrumb: ['properties', name.toLowerCase()],
        metadata: { inclusion: key.includes(name.toLowerCase()) ? 'automatic' : 'available' },
      })),
    ],
  }
}

export const Catalog = z.object({
  streams: z.array(
    z.object({
      stream: z.string().min(1),
      table_name: z.string().min(1),
      metadata: z
        .array(
          z.object({
            breadcrumb: z.array(z.string()),
            metadata: z.object({ selected: z.boolean().optional() }).loose(),
          }),
        )
        .default([]),
    }),
  ),
})
export type Catalog = z.infer<typeof Catalog>

export function isSelected(entry: Catalog['streams'][number]): boolean {
  return entry.metadata.some(
    ({ breadcrumb, metadata }) => breadcrumb.length === 0 && metadata.selected === true,
  )
}
