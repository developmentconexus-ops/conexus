import closeWithGrace from 'close-with-grace'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import type { Config } from './config.ts'
import { Failure, logFailure } from './failure.ts'

/** How long the Hub's close takes at most once nothing is waited for (code C62). */
export const SHUTDOWN_DEADLINE_MS = 15_000
/**
 * How long the Hub waits for answers in flight at a stop signal before it cuts them (founder E1;
 * Cloudflare Durable Objects defer a code update up to 300 s).
 */
export const TURN_SETTLE_MS = 180_000
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

/** What the Hub does when it ends, in this order (`shutDown`). */
type ShutdownSteps = {
  /** Refuses new work and waits for the live work until `bound` aborts, the listeners open. */
  settle: (bound: AbortSignal) => Promise<void>
  drain: () => Promise<void>
  release: () => Promise<void>
}

/** The whole shutdown's deadline at a stop signal: the wait, then the close. */
export const SHUTDOWN_GRACE_MS = TURN_SETTLE_MS + SHUTDOWN_DEADLINE_MS

/**
 * The shutdown's order (code C62): at a stop signal (`settleMs`), `settle` first with the listeners
 * still open, so answers in flight write and new ones are refused (founder E1); then the listeners
 * close while `drain` stops what is left; then `release` the stores. An unexpected error does not
 * wait: the process is in an unknown state, and no update is coming.
 */
export async function shutDown(
  listeners: FastifyInstance[],
  steps: ShutdownSteps,
  settleMs?: number,
): Promise<void> {
  if (settleMs !== undefined) await steps.settle(AbortSignal.timeout(settleMs))
  await closeListeners(listeners, steps.drain)
  await steps.release()
}

/**
 * One shutdown path (`shutDown`); a second signal exits at once. close-with-grace's own lines are
 * prose, so its logger is off and each of its cases logs a code here (C50).
 */
export function shutDownOnSignal(
  app: FastifyInstance,
  edge: FastifyInstance,
  steps: ShutdownSteps,
) {
  function unexpected(cause: unknown) {
    logFailure(app.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
  }
  return closeWithGrace(
    {
      delay: SHUTDOWN_GRACE_MS,
      logger: false,
      onSecondSignal: (signal) => app.log.error({ signal }, 'SHUTDOWN_FORCED'),
      onSecondError: unexpected,
      onTimeout: (delay) => app.log.error({ deadlineMs: delay }, 'SHUTDOWN_TIMED_OUT'),
    },
    async ({ signal, err }) => {
      if (err) unexpected(err)
      app.log.info(signal === undefined ? {} : { signal }, 'SHUTTING_DOWN')
      try {
        await shutDown([app, edge], steps, signal === undefined ? undefined : TURN_SETTLE_MS)
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
