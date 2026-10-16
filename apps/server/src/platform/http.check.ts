import type { Operation } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from './http.ts'

// Never called: `npm run typecheck` fails if `serve` takes an operation that `defineOperation` did
// not declare, so every API route registered through `serve` is in the OpenAPI document (code C28).
export function undeclaredServed(app: FastifyInstance, operation: Operation): void {
  // @ts-expect-error: `serve` takes only a `DeclaredOperation`.
  serve(app, operation, () => answer(undefined))
}
