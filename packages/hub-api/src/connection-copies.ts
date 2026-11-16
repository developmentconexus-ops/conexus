import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { CopyId, CopyMode } from './copies.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

const OfConnection = z.object({ companyId: CompanyId, connectionId: ConnectionId })

/**
 * A copy that reads the connection, as Desligar shows it before the click: `last` when the connection
 * is its only source (Desligar ends the copy), and that account's rows (null when the company's
 * database did not answer).
 */
export const CopyOfConnection = z.object({
  copyId: CopyId,
  name: z.string(),
  mode: CopyMode,
  last: z.boolean(),
  rows: z.int().min(0).nullable(),
})
export type CopyOfConnection = z.infer<typeof CopyOfConnection>

export const listConnectionCopies = defineOperation({
  id: 'listConnectionCopies',
  summary:
    "Lists the copies that read a connection, with what Desligar would take from each: the account's rows, or the whole copy when it is the copy's last source.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/connections/{connectionId}/copies',
  bodyLimit: 1024,
  input: { params: OfConnection },
  success: { status: 200, body: z.object({ copies: z.array(CopyOfConnection) }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE', 'CONNECTION_NOT_FOUND'],
})

/** The rows a copy's sample shows (T7). */
export const COPY_SAMPLE_ROWS = 5

export const CopySample = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.unknown())),
  /** False when the table has more rows than the sample. */
  complete: z.boolean(),
})
export type CopySample = z.infer<typeof CopySample>

export const sampleCopy = defineOperation({
  id: 'sampleCopy',
  summary: 'Shows the first rows of a copy’s table, five at most, read as the member’s role.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/copies/{copyId}/sample',
  bodyLimit: 1024,
  input: { params: z.object({ companyId: CompanyId, copyId: CopyId }) },
  success: { status: 200, body: z.object({ sample: CopySample }) },
  failures: [
    'NOT_FOUND',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
    'COPY_NOT_FOUND',
    'COPY_DATABASE_UNAVAILABLE',
  ] as const satisfies readonly FailureCode[],
})
