import closeWithGrace from 'close-with-grace'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import type { Config } from './config.ts'
import { Failure, logFailure } from './failure.ts'

const SHUTDOWN_DEADLINE_MS = 15_000

/**
 * The first-person command logs to stderr: its stdout is the terminal of infra/first-person.sh,
 * where the link goes.
 */
export function bootLog(level: Config['logLevel'], command = process.argv[2]) {
  const stream = command === 'first-person' ? process.stderr : process.stdout
  return Fastify({ logger: { level, stream } }).log
}

/** Fastify's own listening line is prose; the Hub logs its code once both listeners are up (C50). */
export async function listenQuietly(app: FastifyInstance, port: number): Promise<void> {
  const { level } = app.log
  app.log.level = 'silent'
  try {
    await app.listen({ host: '0.0.0.0', port })
  } finally {
    app.log.level = level
  }
}

/**
 * One shutdown path (code C62): stop accepting, `drain` the live work within the deadline while
 * the listeners close, then `release` the stores; a second signal exits at once. close-with-grace's
 * own lines are prose, so its logger is off and each of its cases logs a code here (C50).
 */
export function shutDownOnSignal(
  app: FastifyInstance,
  edge: FastifyInstance,
  steps: { drain: () => Promise<void>; release: () => Promise<void> },
) {
  function unexpected(cause: unknown) {
    logFailure(app.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
  }
  return closeWithGrace(
    {
      delay: SHUTDOWN_DEADLINE_MS,
      logger: false,
      onSecondSignal: (signal) => app.log.error({ signal }, 'SHUTDOWN_FORCED'),
      onSecondError: unexpected,
      onTimeout: (delay) => app.log.error({ deadlineMs: delay }, 'SHUTDOWN_TIMED_OUT'),
    },
    async ({ signal, err }) => {
      if (err) unexpected(err)
      app.log.info(signal === undefined ? {} : { signal }, 'SHUTTING_DOWN')
      try {
        const closed = Promise.all([app.close(), edge.close()])
        await steps.drain()
        await closed
        await steps.release()
      } catch (error) {
        unexpected(error)
        throw error
      }
    },
  )
}
