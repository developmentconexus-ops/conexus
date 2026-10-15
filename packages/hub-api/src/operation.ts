import type { z } from 'zod'
import type { FailureCode } from './failures.ts'

/** `entry` is a write made without a session; `session` reads the session first. */
export type AccessKind = 'page' | 'public' | 'entry' | 'session'

export type Operation = {
  id: string
  summary: string
  access: AccessKind
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** A path parameter is written `{name}` and read by `input.params`. */
  path: `/api/${string}`
  bodyLimit: number
  input?: { params?: z.ZodType; query?: z.ZodType; body?: z.ZodType }
  /** The create takes an `Idempotency-Key` header, a UUID (code C37). */
  attemptKey?: true
  success: { status: 200; body: z.ZodType } | { status: 201; body: z.ZodType } | { status: 204 }
  failures: readonly FailureCode[]
}
