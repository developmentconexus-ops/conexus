import { PassThrough } from 'node:stream'
import type { FastifyReply } from 'fastify'
import type { z } from 'zod'
import type { FailureLog } from './failure.ts'
import { Failure, logFailure } from './failure.ts'

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === 'object' && value !== null && Symbol.asyncIterator in value
}

/**
 * An operation's events as `text/event-stream`: each one checked against the contract and written
 * as one `data:` line, a comment every `heartbeatMs` so a proxy keeps the stream open, and the
 * events' source closed when the client leaves.
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
  const beat = setInterval(() => out.write(': \n\n'), success.heartbeatMs)
  function close() {
    clearInterval(beat)
    events.return?.().catch(() => undefined)
  }
  reply.raw.once('close', close)
  async function pump() {
    try {
      for (let next = await events.next(); next.done !== true; next = await events.next()) {
        out.write(`data: ${JSON.stringify(success.events.parse(next.value))}\n\n`)
      }
    } catch (cause) {
      logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause }))
    } finally {
      clearInterval(beat)
      out.end()
    }
  }
  pump().catch(() => undefined)
  return reply
    .code(200)
    .header('content-type', 'text/event-stream; charset=utf-8')
    .header('cache-control', 'no-store')
    .header('x-accel-buffering', 'no')
    .send(out)
}
