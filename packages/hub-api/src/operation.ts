import { z } from 'zod'
import type { FailureCode } from './failures.ts'

/** The header of an attempt-keyed write, and its UUID format (code C37). */
export const ATTEMPT_KEY_HEADER = 'Idempotency-Key'
export const AttemptKey = z.uuid()

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
  /** The write takes the `ATTEMPT_KEY_HEADER` header, an `AttemptKey` (code C37). */
  attemptKey?: true
  success: { status: 200; body: z.ZodType } | { status: 201; body: z.ZodType } | { status: 204 }
  failures: readonly FailureCode[]
}

const DECLARED: unique symbol = Symbol('conexus.operation')

/** Declared through `defineOperation`: the only kind `serve` takes and the emitter emits. */
export type DeclaredOperation = Operation & { readonly [DECLARED]: true }

export function defineOperation<const O extends Operation>(operation: O): O & DeclaredOperation {
  return { ...operation, [DECLARED]: true }
}

export function isDeclaredOperation(value: unknown): value is DeclaredOperation {
  return typeof value === 'object' && value !== null && DECLARED in value
}
