import type { LakeClock } from './harness/copy-clock/public.ts'
import { copyClockWorkflow, createLakeClock } from './harness/copy-clock/public.ts'
import type { openGoogleCalls } from './harness/model-accounts/public.ts'
import type { LakeRuns } from './hub/copies/public.ts'
import { COPY_WORKFLOW, createMastra, createMastraStorage, storageOf } from './mastra/index.ts'
import type { Config } from './platform/config.ts'
import type { MastraPool } from './platform/database.ts'
import type { FailureLog } from './platform/failure.ts'

type ConversationsDeps = {
  google: ReturnType<typeof openGoogleCalls>
  mastraPool: MastraPool
  automationClock: Config['automationClock']
  lakeRuns: () => LakeRuns
  log: FailureLog
}

function lakeClockRun(deps: Pick<ConversationsDeps, 'lakeRuns' | 'log'>) {
  return copyClockWorkflow({
    start: (at, connection, cause) => deps.lakeRuns().iniciarRodada(at, connection, cause),
    log: deps.log,
  })
}

async function lakeStart(lakeRuns: LakeRuns, clock: LakeClock) {
  await clock.reconcile(await lakeRuns.scheduled())
  await lakeRuns.queue.start()
}

/**
 * The Hub's one `Mastra` on the pool of Mastra's own login (0010), which runs the lake's copy
 * clock and the retention of Mastra's tables. Its tables are made once at `prepare`, its workers
 * start after every subject is made, and a removal releases the lake clock's schedules.
 */
export function conversationsOf(deps: ConversationsDeps) {
  const { log } = deps
  const mastra = createMastra({
    storage: createMastraStorage(deps.mastraPool),
    log,
    workflows: { [COPY_WORKFLOW]: lakeClockRun(deps) },
    schedulerTickMs: deps.automationClock?.schedulerTickMs,
  })
  const lakeClock = createLakeClock({ mastra, log })
  const conversations = Object.freeze({
    mastra,
    release: (scope: Parameters<typeof lakeClock.release>[0]) => lakeClock.release(scope),
    async prepare(): Promise<void> {
      await storageOf(mastra).init()
      log.info({}, 'MASTRA_STORAGE_READY')
    },
    async start(): Promise<void> {
      await lakeStart(deps.lakeRuns(), lakeClock)
      await mastra.startWorkers()
      log.info({}, 'MASTRA_WORKERS_STARTED')
    },
    async settle(): Promise<void> {
      await mastra.getWorker('scheduler')?.stop()
    },
    async close(): Promise<void> {
      await mastra.shutdown()
      await deps.google.stop()
      await deps.lakeRuns().queue.stop()
    },
  })
  return { conversations, lakeClock }
}
