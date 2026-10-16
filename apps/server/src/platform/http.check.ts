import type { Operation } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from './http.ts'

// Never called: `npm run typecheck` fails if `serve` takes an operation that `defineOperation` did
// not declare. That keeps a hand-built operation out of `serve`; it does not put a declared one
// in the OpenAPI document, which emits what `@conexus/hub-api` exports.
export function undeclaredServed(app: FastifyInstance, operation: Operation): void {
  // @ts-expect-error: `serve` takes only a `DeclaredOperation`.
  serve(app, operation, () => answer(undefined))
}
