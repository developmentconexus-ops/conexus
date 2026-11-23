import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { CopyId } from './copies.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

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
