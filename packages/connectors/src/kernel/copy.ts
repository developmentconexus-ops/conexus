import { z } from 'zod'
import type { Operation } from './operation.ts'

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

const DATED: ReadonlySet<CopyColumnType> = new Set(['date', 'timestamp'])

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

/** A starting point a connector offers; turning a copy on copies `definition` into the company's row. */
export type CopyModel = Readonly<{ id: CopyName; label: string; definition: CopyDefinition }>

/** One page: the definition, the last key read (none on a pass's first page), the two dates of the pass, and the size. */
export const PageInput = z
  .object({
    definition: CopyDefinition,
    after: z.array(z.int()).nullable(), // one per key column
    since: z.iso.date(), // the watermark less one day, or 1900-01-01 on the first pass
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
