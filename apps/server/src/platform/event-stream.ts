import { PassThrough } from 'node:stream'
import { EventId } from '@conexus/hub-api'
import type { FastifyReply } from 'fastify'
import { z } from 'zod'
import type { FailureLog } from './failure.ts'
import { Failure, logFailure } from './failure.ts'

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value
}

const Sent = z.object({ id: EventId, event: z.unknown() })

/**
 * An operation's events as `text/event-stream`: each one checked against the contract and written
 * as its `id:` line and one `data:` line, a comment every `heartbeatMs` so a proxy keeps the stream
 * open, and the events' source closed when the client leaves.
 */
export function sendEvents(
  reply: FastifyReply,
  success: { events: z.ZodType; heartbeatMs: number },
  body: unknown,
  log: FailureLog,
) {
  if (!isAsyncIterable(body)) throw new Failure('INTERNAL_UNEXPECTED')
  const events = body[Symbol.asyncIterator]()
  const out = new PassThrough()
  // A comment at once sends the headers, so the client knows the stream is open.
  out.write(': \n\n')
  const beat = setInterval(() => out.write(': \n\n'), success.heartbeatMs)
  function unexpected(cause: unknown) {
    logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause }))
  }
  function close() {
    clearInterval(beat)
    events.return?.().catch(unexpected)
  }
  reply.raw.once('close', close)
  async function pump() {
    try {
      for (let next = await events.next(); next.done !== true; next = await events.next()) {
        const { id, event } = Sent.parse(next.value)
        out.write(`id: ${id}\ndata: ${JSON.stringify(success.events.parse(event))}\n\n`)
      }
    } catch (cause) {
      unexpected(cause)
    } finally {
      clearInterval(beat)
      out.end()
    }
  }
  pump().catch(unexpected)
  return reply
    .code(200)
    .header('content-type', 'text/event-stream; charset=utf-8')
    .header('cache-control', 'no-store')
    .header('x-accel-buffering', 'no')
    .send(out)
}
