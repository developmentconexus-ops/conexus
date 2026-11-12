import { z } from 'zod'
import { InCompany } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

/** The longest text the person keeps in what the Assistant remembers of them, the same the model is told. */
export const PROFILE_MEMORY_MAX = 4000

const PATH = '/api/companies/{companyId}/assistant/profile-memory'

const FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const getProfileMemory = defineOperation({
  id: 'getProfileMemory',
  summary:
    'Reads what the Assistant keeps about the person in the company, across their conversations; `null` while it keeps nothing.',
  access: 'session',
  method: 'GET',
  path: PATH,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ text: z.string().nullable() }) },
  failures: FAILURES,
})

export const setProfileMemory = defineOperation({
  id: 'setProfileMemory',
  summary:
    'Replaces what the Assistant keeps about the person in the company with the text they wrote; the next conversation reads it.',
  access: 'session',
  method: 'PUT',
  path: PATH,
  bodyLimit: 32 * 1024,
  input: { params: InCompany, body: z.object({ text: z.string().max(PROFILE_MEMORY_MAX) }) },
  success: { status: 200, body: z.object({ text: z.string() }) },
  failures: FAILURES,
})

export const clearProfileMemory = defineOperation({
  id: 'clearProfileMemory',
  summary: 'Erases what the Assistant keeps about the person in the company.',
  access: 'session',
  method: 'DELETE',
  path: PATH,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 204 },
  failures: FAILURES,
})
