import type { z } from 'zod'
import type { FailureCode } from './failures.ts'

/** `entry` is a write made without a session; `session` reads the session first. */
export type AccessKind = 'page' | 'public' | 'entry' | 'session'

export type Operation = {
  id: string
  summary: string
  access: AccessKind
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: `/api/${string}`
  bodyLimit: number
  input?: { body?: z.ZodType }
  success: { status: 200; body: z.ZodType } | { status: 204 }
  failures: readonly FailureCode[]
}
