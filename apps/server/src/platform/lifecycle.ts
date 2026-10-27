import closeWithGrace from 'close-with-grace'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import type { Config } from './config.ts'
import { Failure, logFailure } from './failure.ts'

const SHUTDOWN_DEADLINE_MS = 15_000
/** The Mastra deployer's default `drainTimeout` (`deployer/src/server/index.ts:590`, 1.78). */
const DRAIN_MS = 5_000

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
        await closeListeners([app, edge], steps.drain)
        await steps.release()
      } catch (error) {
        unexpected(error)
        throw error
      }
    },
  )
}

/**
 * The listeners close in the Mastra deployer's order (`deployer/src/server/index.ts:713-734`, 1.78):
 * they stop accepting, idle connections are closed at once and every 100 ms, and what is still
 * open `DRAIN_MS` after the close began is cut, with a warning. One difference: `drain` runs
 * inside that window and also stops Mastra, which the deployer does after it. A request that ends
 * inside the window keeps its database; one still running after the cut finds the pools closed by
 * `release`, as in the deployer.
 */
export async function closeListeners(listeners: FastifyInstance[], drain: () => Promise<void>) {
  const closed = Promise.all(listeners.map((listener) => listener.close()))
  function closeIdle() {
    for (const listener of listeners) listener.server.closeIdleConnections()
  }
  closeIdle()
  const sweep = setInterval(closeIdle, 100)
  const cut = setTimeout(() => {
    listeners[0]?.log.warn({ timeoutMs: DRAIN_MS }, 'SHUTDOWN_CONNECTIONS_CUT')
    for (const listener of listeners) listener.server.closeAllConnections()
  }, DRAIN_MS)
  try {
    await drain()
    await closed
  } finally {
    clearInterval(sweep)
    clearTimeout(cut)
  }
}
