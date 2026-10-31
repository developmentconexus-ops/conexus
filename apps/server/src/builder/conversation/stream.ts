import type { ServerResponse } from 'node:http'
import type { WireDisplayState } from '@mastra/core/agent-controller'
import { MastraServer } from '@mastra/fastify'
import type { ServerRoute } from '@mastra/server/server-adapter'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FailureLog, Scalar } from '../../platform/failure.ts'

/**
 * 8 MiB of events a page has not read yet. A display state the page reads is about 1 KB, and the
 * largest other event is a message or a tool's input or result, tens of KB (a connector read is at
 * most 18 KB). A page this far behind reads the transcript and the session again when its stream
 * opens again (`apps/web` `use-session.ts` `resync`), which costs less than holding the rest.
 */
const STREAM_BEHIND_BYTES = 8 * 1024 * 1024

/** What the screen reads of the display state (`apps/web` `session-state.ts` `displayed`). */
const DISPLAY_READ = [
  'isRunning',
  'pendingSuspensions',
  'omProgress',
  'bufferingMessages',
  'bufferingObservations',
] as const satisfies readonly (keyof WireDisplayState)[]

type Ended = 'CLOSED' | 'BEHIND' | 'SESSION_ENDED' | 'FAILED'

/**
 * A `display_state_changed` event with only what the screen reads. Mastra sends the session's whole
 * display state after every event (the turn's message and every tool's input and result, core
 * `agent-controller/session.ts`), which grows with the square of a turn's length.
 */
function slim(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value
  if (Reflect.get(value, 'type') !== 'display_state_changed') return value
  const display: unknown = Reflect.get(value, 'displayState')
  if (typeof display !== 'object' || display === null) return value
  const read = Object.fromEntries(DISPLAY_READ.map((key) => [key, Reflect.get(display, key)]))
  return { type: 'display_state_changed', displayState: read }
}

function sizeOf(value: unknown): number {
  return typeof value === 'string' ? value.length : (JSON.stringify(value)?.length ?? 0)
}

/** Resolves once the response can take more, or is closed. */
function drained(response: ServerResponse): Promise<void> {
  if (!response.writableNeedDrain || response.destroyed) return Promise.resolve()
  return new Promise((resolve) => {
    function done() {
      response.off('drain', done)
      response.off('close', done)
      resolve()
    }
    response.on('drain', done)
    response.on('close', done)
  })
}

/**
 * Mastra's stream as the response can take it. Mastra's handler pushes every event into its stream
 * as it happens, and its adapter writes each one without waiting for `drain`, so a page that reads
 * slower than a turn talks keeps the rest in the Hub's heap (`@mastra/server@1.79.0`
 * `handlers/agent-controller.js:531-631`, `@mastra/fastify@1.5.23` `dist/index.js:162-180`). Here
 * every event is read at once and slimmed, so Mastra's copy of the whole display state is let go,
 * and the adapter gets the next one only once the response drained. Past `STREAM_BEHIND_BYTES` not
 * yet written, the response is destroyed: Mastra's client opens the stream again.
 */
function paced(
  source: ReadableStream,
  response: ServerResponse,
  ended: (reason: Ended, fields?: Record<string, Scalar>) => void,
): ReadableStream {
  const reader = source.getReader()
  const pending: { event: unknown; size: number }[] = []
  let behind = 0
  let finished = false
  let wake: (() => void) | undefined

  function stop(reason: Ended, fields?: Record<string, Scalar>) {
    if (finished) return
    finished = true
    pending.length = 0
    behind = 0
    wake?.()
    ended(reason, fields)
    reader
      .cancel(reason)
      .catch((error: unknown) => ended('FAILED', { during: 'cancel', ...named(error) }))
  }

  async function pump() {
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done || finished) break
        const event = slim(value)
        const size = sizeOf(event)
        pending.push({ event, size })
        behind += size
        if (behind + response.writableLength > STREAM_BEHIND_BYTES) {
          stop('BEHIND', { bytes: behind + response.writableLength })
          response.destroy()
          return
        }
        wake?.()
      }
      if (!finished) {
        finished = true
        // Mastra's handler also closes its stream when the request leaves.
        ended(response.closed ? 'CLOSED' : 'SESSION_ENDED')
      }
      wake?.()
    } catch (error) {
      stop('FAILED', { during: 'read', ...named(error) })
      response.destroy()
    }
  }

  return new ReadableStream(
    {
      start() {
        void pump()
      },
      async pull(controller) {
        await drained(response)
        while (pending.length === 0 && !finished) {
          await new Promise<void>((resolve) => {
            wake = resolve
          })
        }
        if (pending.length === 0) {
          controller.close()
          return
        }
        const next = pending.shift()
        if (next === undefined) return
        behind -= next.size
        controller.enqueue(next.event)
      },
      cancel() {
        stop('CLOSED')
      },
    },
    { highWaterMark: 0 },
  )
}

function named(error: unknown): Record<string, string> {
  return { name: error instanceof Error ? error.name : typeof error }
}

/**
 * Mastra's Fastify adapter with its stream paced and slimmed (`paced`); every ended stream is
 * logged with why.
 */
export class BuilderServer extends MastraServer {
  readonly #log: FailureLog

  constructor(options: ConstructorParameters<typeof MastraServer>[0] & { log: FailureLog }) {
    super(options)
    this.#log = options.log
  }

  override stream(
    route: ServerRoute,
    reply: FastifyReply,
    result: { fullStream: ReadableStream } | ReadableStream,
    request?: FastifyRequest,
  ): Promise<void> {
    const source = result instanceof ReadableStream ? result : result.fullStream
    const params: unknown = request?.params
    const sessionId =
      typeof params === 'object' && params !== null ? Reflect.get(params, 'sessionId') : undefined
    const conversation: Record<string, Scalar> =
      typeof sessionId === 'string' ? { conversationId: sessionId } : {}
    const log = this.#log
    function ended(reason: Ended, fields: Record<string, Scalar> = {}) {
      const line = { ...conversation, reason, ...fields }
      if (reason === 'FAILED') log.error(line, 'BUILDER_STREAM_ENDED')
      else log.info(line, 'BUILDER_STREAM_ENDED')
    }
    return super.stream(route, reply, { fullStream: paced(source, reply.raw, ended) }, request)
  }
}
