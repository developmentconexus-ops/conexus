import type { z } from 'zod'
import type { FailureCode } from './failures.ts'

export type AccessKind = 'page' | 'public'

export type Operation = {
  id: string
  summary: string
  access: AccessKind
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: `/api/${string}`
  bodyLimit: number
  success: { status: 200; body: z.ZodType }
  failures: readonly FailureCode[]
}
