import { z } from 'zod'
import type { FailureCode } from './failures.ts'

/** The header of an attempt-keyed write, and its UUID format (code C37). */
export const ATTEMPT_KEY_HEADER = 'Idempotency-Key'
export const AttemptKey = z.uuid()

/**
 * `entry` is a write made without a session; `session` reads the session first; `edge` exists only
 * on the listener the apps' dispatcher alone reaches; `handoff` is the one route a navigation from
 * another site reaches (security S48).
 */
export type AccessKind = 'page' | 'public' | 'entry' | 'session' | 'edge' | 'handoff'

export type Operation = {
  id: string
  summary: string
  /** The `handoff` route answers a navigation, never JSON, so no operation declares it. */
  access: Exclude<AccessKind, 'handoff'>
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** A path parameter is written `{name}` and read by `input.params`. */
  path: `/api/${string}`
  bodyLimit: number
  input?: { params?: z.ZodType; query?: z.ZodType; body?: z.ZodType }
  /** The write takes the `ATTEMPT_KEY_HEADER` header, an `AttemptKey` (code C37). */
  attemptKey?: true
  success:
    | { status: 200; body: z.ZodType }
    | { status: 201; body: z.ZodType }
    | { status: 202 | 204 }
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

/**
 * The failures the platform answers around every operation's handler (code C28, C26): `serve`
 * registers them with the operation's own, the OpenAPI document lists them, and the test door
 * allows them. Fastify reads a body whatever the method, so even an operation with no `input.body`
 * is refused for a body's media type and size.
 */
const PLATFORM_FAILURES = [
  'REQUEST_ORIGIN_REFUSED',
  'REQUEST_MALFORMED',
  'REQUEST_MEDIA_TYPE_REFUSED',
  'REQUEST_TOO_LARGE',
  'INTERNAL_UNEXPECTED',
] as const satisfies readonly FailureCode[]

/** What an operation can answer besides its success: the platform's failures and its own. */
export function failuresOf(operation: Operation): FailureCode[] {
  return [...new Set<FailureCode>([...PLATFORM_FAILURES, ...operation.failures])]
}
