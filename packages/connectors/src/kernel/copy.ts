import { z } from 'zod'
import type { Operation } from './operation.ts'
import { OperationId } from './operation.ts'

/** The rows one page of a copy reads; the Hub's run asks for no more (decision 0063: a page stays far under the executor's cap). */
export const PAGE_ROWS = 500

/** A copy's name: the table it fills in the company's `sync` schema; a template gives it. */
export const CopyName = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,39}$/)
  .brand<'CopyName'>()
export type CopyName = z.infer<typeof CopyName>

/** A column of the source as the source names it, in any case; quoted wherever it is written. */
const CopyColumnName = z.string().regex(/^[A-Za-z_][A-Za-z0-9_]{0,59}$/)
export const CopyColumnType = z.enum(['text', 'numeric', 'bigint', 'date', 'timestamp', 'boolean'])
export type CopyColumnType = z.infer<typeof CopyColumnType>

const DATED: ReadonlySet<CopyColumnTypeV2> = new Set(['date', 'timestamp'])

/** What a copy reads, the company's data from the moment it is turned on (version 1, one kind of source). */
export const CopyDefinition = z
  .object({
    version: z.literal(1),
    // No date filter in it: the paged read adds the dates of each pass.
    source: z.object({ kind: z.literal('QUERY'), sql: z.string().min(1).max(8000) }),
    columns: z
      .array(z.object({ name: CopyColumnName, type: CopyColumnType }))
      .min(1)
      .max(100),
    key: z.array(CopyColumnName).min(1).max(4), // bigint columns, in page order (version 1)
    changedSince: z.object({ column: CopyColumnName }).nullable(), // none: every pass reads the whole source
    window: z.object({ column: CopyColumnName, days: z.int().min(1).max(90) }).optional(),
  })
  .superRefine((definition, context) => {
    const types = new Map(definition.columns.map(({ name, type }) => [name, type]))
    if (types.size !== definition.columns.length)
      context.addIssue({ code: 'custom', path: ['columns'], message: 'A column is repeated.' })
    if (new Set(definition.key).size !== definition.key.length)
      context.addIssue({ code: 'custom', path: ['key'], message: 'A key column is repeated.' })
    definition.key.forEach((name, at) => {
      if (types.get(name) !== 'bigint')
        context.addIssue({
          code: 'custom',
          path: ['key', at],
          message: 'A key column is a bigint column of the columns.',
        })
    })
    for (const field of ['changedSince', 'window'] as const) {
      const column = definition[field]?.column
      const type = column === undefined ? undefined : types.get(column)
      if (column !== undefined && (type === undefined || !DATED.has(type)))
        context.addIssue({
          code: 'custom',
          path: [field, 'column'],
          message: 'The column is a date or timestamp column of the columns.',
        })
    }
  })
export type CopyDefinition = z.infer<typeof CopyDefinition>

/** Version 2 adds `json`, the cell of a nested value as its JSON text. */
export const CopyColumnTypeV2 = z.enum([...CopyColumnType.options, 'json'])
export type CopyColumnTypeV2 = z.infer<typeof CopyColumnTypeV2>

/**
 * The canonical text of each type's cell, the one owner: `list.ts` and Sankhya's copy read convert to it,
 * each tested against it. A timestamp of version 1 has neither fraction nor offset; version 2 keeps both.
 */
export const CANONICAL_CELL: Readonly<Record<CopyColumnTypeV2, RegExp>> = {
  text: /^[\s\S]*$/,
  numeric: /^-?\d+(\.\d+)?$/,
  bigint: /^-?\d+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  boolean: /^(true|false)$/,
  json: /^[\s\S]*$/,
}

const KEYED: ReadonlySet<CopyColumnTypeV2> = new Set(['bigint', 'text'])
const Dotted = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*$/)
  .max(200)
const Scalar = z.union([z.string().max(200), z.number(), z.boolean()])

/** What a copy reads from an operation of the connector (version 2): the column's `path` is where its value sits in a row of the read. No `window`: a key it does not know is refused. */
export const CopyDefinitionV2 = z
  .strictObject({
    version: z.literal(2),
    source: z.object({
      kind: z.literal('OPERATION'),
      operation: OperationId,
      input: z.record(z.string(), Scalar).default({}),
    }),
    description: z.string().trim().min(1).max(500),
    columns: z
      .array(
        z.object({
          name: CopyColumnName,
          type: CopyColumnTypeV2,
          path: Dotted,
          description: z.string().trim().max(200).optional(),
        }),
      )
      .min(1)
      .max(100),
    key: z.array(CopyColumnName).min(1).max(4), // bigint or text columns
    changedSince: z.object({ column: CopyColumnName }).nullable(), // none: every pass reads the whole source
  })
  .superRefine((definition, context) => {
    const types = new Map(definition.columns.map(({ name, type }) => [name, type]))
    if (types.size !== definition.columns.length)
      context.addIssue({ code: 'custom', path: ['columns'], message: 'A column is repeated.' })
    definition.columns.forEach(({ name }, at) => {
      if (name.startsWith('_'))
        context.addIssue({
          code: 'custom',
          path: ['columns', at, 'name'],
          message: 'A column name does not start with "_": the engine owns those.',
        })
    })
    if (new Set(definition.key).size !== definition.key.length)
      context.addIssue({ code: 'custom', path: ['key'], message: 'A key column is repeated.' })
    definition.key.forEach((name, at) => {
      const type = types.get(name)
      if (type === undefined || !KEYED.has(type))
        context.addIssue({
          code: 'custom',
          path: ['key', at],
          message: 'A key column is a bigint or text column of the columns.',
        })
    })
    const column = definition.changedSince?.column
    const type = column === undefined ? undefined : types.get(column)
    if (column !== undefined && (type === undefined || !DATED.has(type)))
      context.addIssue({
        code: 'custom',
        path: ['changedSince', 'column'],
        message: 'The column is a date or timestamp column of the columns.',
      })
  })
export type CopyDefinitionV2 = z.infer<typeof CopyDefinitionV2>

/** How far a pass has read, as the source's own paging gives it: after a key (version 1), at an offset, or at a cursor and the instant it was given. */
export const CopyPosition = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('KEY'), after: z.array(z.int()) }),
  z.object({ kind: z.literal('OFFSET'), offset: z.int().min(0) }),
  z.object({
    kind: z.literal('CURSOR'),
    cursor: z.string().min(1).max(4000),
    at: z.iso.datetime(),
  }),
])
export type CopyPosition = z.infer<typeof CopyPosition>

/** A starting point a connector offers; turning a copy on copies `definition` into the company's row. */
export type CopyModel = Readonly<{ id: CopyName; label: string; definition: CopyDefinition }>

/** One page: the definition, the last key read (none on a pass's first page), the two dates of the pass, and the size. */
export const PageInput = z
  .object({
    definition: CopyDefinition,
    after: z.array(z.int()).nullable(), // one per key column
    since: z.iso.date().nullable(), // the watermark less one day; null on the first pass, which reads all (#940)
    windowFrom: z.iso.date().nullable(), // the pass's start less the window's days
    limit: z.int().min(1).max(PAGE_ROWS),
  })
  .refine((page) => page.after === null || page.after.length === page.definition.key.length, {
    path: ['after'],
    message: 'One value per key column.',
  })
export type PageInput = z.infer<typeof PageInput>

/** The rows in the definition's column order, each cell its type's canonical text or null; `more` when another page follows. */
export const CopyPageSchema = z.object({
  rows: z.array(z.array(z.string().nullable())),
  more: z.boolean(),
})
export type CopyPage = Readonly<{ rows: readonly (readonly (string | null)[])[]; more: boolean }>

/** What a connector offers for copies: the one paged read and its templates. */
export type ConnectorCopy = Readonly<{
  read: Operation<PageInput, CopyPage, 'read'>
  models: readonly CopyModel[]
}>
