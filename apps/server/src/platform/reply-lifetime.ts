import type { FastifyReply } from 'fastify'

/**
 * Aborts when the client leaves before the reply is sent. Fastify's `request.signal` follows the
 * request's `close` (fastify/lib/request.js:218-229), which Node emits once the body is read, so a
 * write would abort its own e-mail (docs/reference/boundaries.md).
 */
export function untilClientLeaves(reply: FastifyReply): AbortSignal {
  const left = new AbortController()
  reply.raw.once('close', () => {
    if (!reply.raw.writableFinished) left.abort()
  })
  return left.signal
}

/**
 * Runs `work` once the reply is over, whether it was flushed or the client left first: `finish`
 * never comes for a reply nobody reads, and a write that committed owes its mail either way. A
 * client already gone has had its `close`, so the work runs at once.
 */
export function whenReplyEnds(reply: FastifyReply, work: () => void): void {
  if (reply.raw.destroyed) work()
  else reply.raw.once('close', work)
}
