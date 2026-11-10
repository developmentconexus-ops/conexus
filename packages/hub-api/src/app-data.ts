import { z } from 'zod'
import { OfProject } from './apps.ts'
import { Next, Page } from './companies.ts'
import { defineOperation } from './operation.ts'

/** A table of an app's schema, as PostgreSQL names it: 1 to 63 characters (NAMEDATALEN − 1), never NUL, which no name holds. */
export const AppTableName = z
  .string()
  .min(1)
  .max(63)
  .refine((name) => !name.includes('\0'))
  .brand<'AppTableName'>()
export type AppTableName = z.infer<typeof AppTableName>

/** How many rows a table has: exact below the cap, past it, or unknown when the count failed. */
export const ROW_COUNT_CAP = 10_000
export const RowCount = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('EXACT'), rows: z.int().min(0).max(ROW_COUNT_CAP) }),
  z.object({ kind: z.literal('OVER') }),
  z.object({ kind: z.literal('UNKNOWN') }),
])
export type RowCount = z.infer<typeof RowCount>

/** Where a table lives: the app's own schema, or the copies released to the Projeto (`sync`). */
export const TableSchemaName = z.enum(['APP', 'COPY'])
export type TableSchemaName = z.infer<typeof TableSchemaName>

export const AppTableSummary = z.object({
  schema: TableSchemaName,
  name: AppTableName,
  rows: RowCount,
})
export type AppTableSummary = z.infer<typeof AppTableSummary>

export const AppTables = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('NO_APP') }),
  z.object({ kind: z.literal('TABLES'), tables: z.array(AppTableSummary) }),
])
export type AppTables = z.infer<typeof AppTables>

/** The characters a cell shows; one more read from the database says it was cut. */
export const CELL_CHARACTERS = 100
export const AppCell = z
  .object({ text: z.string().max(CELL_CHARACTERS), cut: z.boolean() })
  .nullable()
export type AppCell = z.infer<typeof AppCell>

export const AppRows = z.object({
  columns: z.array(z.object({ name: z.string() })),
  rows: z.array(z.array(AppCell)),
  next: Next,
})
export type AppRows = z.infer<typeof AppRows>

export const listAppTables = defineOperation({
  id: 'listAppTables',
  summary: 'Lists the tables of a Projeto’s app with their row counts, for who builds.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/tables',
  bodyLimit: 1024,
  input: { params: OfProject },
  success: { status: 200, body: AppTables },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE', 'APP_DATABASE_UNAVAILABLE'],
})

export const listAppRows = defineOperation({
  id: 'listAppRows',
  summary: 'Lists one page of a table of a Projeto’s app, each cell as text, for who builds.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/tables/{table}/rows',
  bodyLimit: 1024,
  input: { params: OfProject.extend({ table: AppTableName }), query: Page },
  success: { status: 200, body: AppRows },
  failures: [
    'NOT_FOUND',
    'SESSION_REQUIRED',
    'REQUEST_MALFORMED',
    'DATABASE_UNAVAILABLE',
    'APP_DATABASE_UNAVAILABLE',
    'APP_TABLE_TOO_WIDE',
  ],
})

export const listCopyRows = defineOperation({
  id: 'listCopyRows',
  summary: 'Lists one page of a copy released to a Projeto, each cell as text, for who builds.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/copy-tables/{table}/rows',
  bodyLimit: 1024,
  input: { params: OfProject.extend({ table: AppTableName }), query: Page },
  success: { status: 200, body: AppRows },
  failures: listAppRows.failures,
})
