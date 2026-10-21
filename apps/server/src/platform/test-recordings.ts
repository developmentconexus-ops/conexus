import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ProviderId } from '@conexus/hub-api'
import { z } from 'zod'

/** The provider replies `scripts/record-provider.ts` saved: `<provider>-<case>.sse` and its `.json`. */
export const RECORDINGS = join(import.meta.dirname, 'recordings')

/** An address, a bearer or a key's known prefix: a person or a credential, never in a recording (S40). */
export const LEAK = /[\w.+-]+@[\w-]+\.[\w.-]+|bearer\s|sk-ant-|ya29\.|AIza/i

/** What a recording names beside its wire body (testing T24). */
export const Recording = z.object({
  provider: ProviderId,
  api: z.string().min(1),
  sdk: z.string().min(1),
  recordedAt: z.iso.date(),
})
export type Recording = z.infer<typeof Recording>

/** The body a recording kept, byte for byte as the provider sent it. */
export function recordedBody(name: string): Buffer {
  return readFileSync(join(RECORDINGS, `${name}.sse`))
}

/**
 * Whether the provider ended the recorded stream, with the Messages API's `message_stop` or Chat
 * Completions' `[DONE]`; a stream the client cut has neither.
 */
export function endedOf(body: Buffer): boolean {
  const text = body.toString('utf8')
  return text.includes('event: message_stop') || text.includes('data: [DONE]')
}

/**
 * A recorded reply, sent as the provider sent it; a stream the client cut stays open after its
 * last byte, as the provider was still sending, until `signal` aborts.
 */
export function replayed(name: string, signal: AbortSignal | null | undefined): Response {
  const body = recordedBody(name)
  const headers = { 'content-type': 'text/event-stream' }
  if (endedOf(body)) return new Response(body, { headers })
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(body)
      signal?.addEventListener('abort', () => controller.error(signal.reason), { once: true })
    },
  })
  return new Response(stream, { headers })
}
