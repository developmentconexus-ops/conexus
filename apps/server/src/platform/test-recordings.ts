import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ProviderId } from '@conexus/hub-api'
import { z } from 'zod'

/** The provider replies `scripts/record-provider.ts` saved: `<provider>-<case>.sse` and its `.json`. */
export const RECORDINGS = join(import.meta.dirname, 'recordings')

/** What the native flow's recordings hold: `scripts/record.ts` saved `mastra/<scenario>.jsonl`. */
export const NATIVE_RECORDINGS = join(RECORDINGS, 'mastra')

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
  if (endedOf(body)) return new Response(new Uint8Array(body), { headers })
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(body)
      signal?.addEventListener('abort', () => controller.error(signal.reason), { once: true })
    },
  })
  return new Response(stream, { headers })
}

/** The first line of a native recording: the library, its version and the provider body it replayed (testing T24). */
export const NativeHeader = z.object({
  kind: z.literal('header'),
  scenario: z.string().min(1),
  library: z.string().min(1),
  version: z.string().min(1),
  sdk: z.string().min(1),
  source: z.string().min(1),
  recordedAt: z.iso.date(),
})
export type NativeHeader = z.infer<typeof NativeHeader>

const NativeLine = z.discriminatedUnion('kind', [
  NativeHeader,
  z.object({ kind: z.literal('event'), event: z.looseObject({ type: z.string() }) }),
  z.object({ kind: z.literal('row'), table: z.string(), row: z.unknown() }),
])

/**
 * What Mastra's AgentController emitted and stored for one scenario, as it emitted and stored it:
 * a test feeds our code these events and rows, never ones typed by hand (testing T24).
 */
export function nativeRecording(scenario: string) {
  const lines = readFileSync(join(NATIVE_RECORDINGS, `${scenario}.jsonl`), 'utf8')
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => NativeLine.parse(JSON.parse(line)))
  const [header, ...rest] = lines
  if (header?.kind !== 'header') throw new Error(`${scenario}.jsonl does not start with its header`)
  return {
    header,
    events: rest.flatMap((line) => (line.kind === 'event' ? [line.event] : [])),
    rows: rest.flatMap((line) => (line.kind === 'row' ? [line] : [])),
  }
}
