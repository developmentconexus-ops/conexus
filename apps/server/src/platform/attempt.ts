import { createHash } from 'node:crypto'

/** The hash a repeated Idempotency-Key is compared by (code C37): never the body itself. sha256, base64url. */
export function bodyHashOf(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('base64url')
}
