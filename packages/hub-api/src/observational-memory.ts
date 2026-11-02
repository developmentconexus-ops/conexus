import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ModelId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

/**
 * One role's choice: `null` follows the conversation's model, `'auto'` is the company's cheapest
 * model (Mastra's `'auto'` for observational memory), and a model id is that model. A company that
 * never chose reads `'auto'`.
 */
export const ObservationalMemoryChoice = z.union([z.literal('auto'), ModelId]).nullable()
export type ObservationalMemoryChoice = z.infer<typeof ObservationalMemoryChoice>

export const ObservationalMemoryModels = z.object({
  observer: ObservationalMemoryChoice,
  reflector: ObservationalMemoryChoice,
})
export type ObservationalMemoryModels = z.infer<typeof ObservationalMemoryModels>

export const ObservationalMemoryRole = z.enum(['observer', 'reflector'])
export type ObservationalMemoryRole = z.infer<typeof ObservationalMemoryRole>

const InCompany = z.object({ companyId: CompanyId })
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const readObservationalMemoryModels = defineOperation({
  id: 'readObservationalMemoryModels',
  summary: 'Reads the company’s Observer and Reflector model selections.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/observational-memory-models',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: ObservationalMemoryModels },
  failures: READ_FAILURES,
})

export const setObservationalMemoryModel = defineOperation({
  id: 'setObservationalMemoryModel',
  summary: 'Sets or resets one of the company’s observational-memory models.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/observational-memory-models',
  bodyLimit: 1024,
  input: {
    params: InCompany,
    body: z.object({ role: ObservationalMemoryRole, model: ObservationalMemoryChoice }),
  },
  success: { status: 200, body: ObservationalMemoryModels },
  failures: [...READ_FAILURES, 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT'],
})
