import type { Native, ProviderAnswer, Unread } from '@conexus/connectors'
import { locateOf } from '@conexus/connectors'
import { z } from 'zod'

/**
 * A provider's answer is read up to this many bytes and no further. Measured on a real Sankhya
 * (2026-10-30), a page of 50 reached 354 KB (clientes), 500 KB (notas fiscais) and 931 KB
 * (devoluções); the OS's 256 KB came from its SQL gateway and cut REST pages.
 */
const RESPONSE_CAP_BYTES = 2 * 1024 * 1024

/** The provider answered what the kit cannot read, with what it said. */
export type Unreadable = Readonly<{ kind: 'UNREADABLE'; native: Native }>

/** The body, read in pieces up to the cap; past it the read is cancelled, nothing is kept and the result is null. */
export async function bodyOf(response: Response): Promise<Uint8Array | null> {
  const chunks: Uint8Array[] = []
  let bytes = 0
  const reader = response.body?.getReader()
  if (reader === undefined) return new Uint8Array()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return Buffer.concat(chunks)
    bytes += value.byteLength
    if (bytes > RESPONSE_CAP_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
}

const REDACTED = '[redacted]'

/** The request's secrets, replaced in what comes back; `whole2xx`: a 2xx reaches the kit unchanged. */
export type Redaction = Readonly<{ secrets: readonly string[]; whole2xx: boolean }>

/** The text with every secret of the request replaced, as it is and as JSON writes it (Nango's `buildValuesToFilter`). */
function redacted(text: string, secrets: readonly string[]): string {
  return secrets
    .filter((secret) => secret !== '')
    .flatMap((secret) => [secret, JSON.stringify(secret).slice(1, -1)])
    .reduce((safe, secret) => safe.replaceAll(secret, REDACTED), text)
}

export function isOk(status: number): boolean {
  return status >= 200 && status < 300
}

/**
 * The body read only at the end, with the request's secrets replaced first, whatever the status
 * (a gateway refuses at HTTP 200 and carries its body in `native`), except a 2xx sent `whole`. Text
 * that is not JSON is the body itself outside 2xx, so the kit still decides by status; a 2xx that
 * is not JSON is null, never an empty answer.
 */
export function answerOf(
  status: number,
  bytes: Uint8Array,
  redaction: Redaction,
  waitMs?: number,
): ProviderAnswer | null {
  const wait = waitMs === undefined ? {} : { retryAfterMs: waitMs }
  if (bytes.byteLength === 0) return { status, body: undefined, ...wait }
  const text = Buffer.from(bytes).toString('utf8')
  const safe = redaction.whole2xx && isOk(status) ? text : redacted(text, redaction.secrets)
  try {
    return { status, body: z.unknown().parse(JSON.parse(safe)), ...wait }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return isOk(status) ? null : { status, body: safe, ...wait }
  }
}

export function nativeOf(status: number, body: unknown): Native {
  return { status, ...locateOf(body), body }
}

/** An answer the kit never sees: past the cap (`bytes` null), or a 2xx in text that is not JSON; the screen says which. */
export function unreadable(status: number, bytes: Uint8Array | null): Unreadable {
  const reason: Unread =
    bytes === null
      ? { kind: 'TOO_LARGE', limitBytes: RESPONSE_CAP_BYTES }
      : { kind: 'SHAPE', issues: [{ path: '', expected: 'json', received: 'text' }] }
  return { kind: 'UNREADABLE', native: { ...nativeOf(status, null), reason } }
}
