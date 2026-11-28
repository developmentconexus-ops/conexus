import { Mastra } from '@mastra/core/mastra'
import { SpanType } from '@mastra/core/observability'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { AnyWorkflow, SchedulerConfig } from '@mastra/core/workflows'
import { MastraStorageExporter, Observability } from '@mastra/observability'
import type { FailureLog } from '../platform/failure.ts'
import { HubLogger } from './logger.ts'
import { RETENTION_WORKFLOW, retentionOf } from './workflows/retention.ts'

export { HubLogger } from './logger.ts'
export { createMastraStorage, RETENTION_DAYS } from './storage.ts'
export { COPY_WORKFLOW, retentionOf, storageOf } from './workflows/retention.ts'

/** The messages of a step the trace keeps whole. */
const MESSAGES_KEPT = 500

/** Ticks an automation whose workflow is missing survives before Mastra deletes it. */
const MISSES_BEFORE_DELETE = 5

/** Mastra's scheduler, its publish failures (after its own retries) in the central log under a code of ours. */
export function schedulerOf(log: FailureLog, tickMs: number | undefined) {
  const config = {
    ...(tickMs === undefined ? {} : { tickIntervalMs: tickMs }),
    missesBeforeDelete: MISSES_BEFORE_DELETE,
    onError: (_error, context) =>
      log.error({ scheduleId: context.scheduleId }, 'SCHEDULE_PUBLISH_FAILED'),
  } satisfies SchedulerConfig
  return config
}

/**
 * The Hub's one `Mastra` (step 24.1, H1): every workflow under its id, on one store and one logger. Its scheduler ticks at Mastra's own interval unless a test shortens it.
 * Its traces, logs and metrics go to Mastra's own database (decision 0068); Mastra adds its
 * `SensitiveDataFilter` as the last span processor by itself.
 */
export function createMastra(deps: {
  storage: MastraCompositeStore
  log: FailureLog
  workflows: Readonly<Record<string, AnyWorkflow>>
  schedulerTickMs: number | undefined
}): Mastra {
  return new Mastra({
    logger: new HubLogger(deps.log),
    storage: deps.storage,
    workflows: { ...deps.workflows, [RETENTION_WORKFLOW]: retentionOf({ log: deps.log }) },
    scheduler: schedulerOf(deps.log, deps.schedulerTickMs),
    // `startWorkers()` starts a loop that restarts the runs a dead process left RUNNING, which
    // re-issues their paid model calls and reads the schedule table every minute (D27); the Hub
    // restarts nothing (`@mastra/core` 1.86.0 `mastra/index.d.ts:417-445`).
    recovery: { workflows: 'off' },
    observability: new Observability({
      configs: {
        default: {
          serviceName: 'conexus-hub',
          exporters: [new MastraStorageExporter()],
          // One row per streamed chunk says nothing a step does not; Mastra's own platform exporter
          // drops them too (`@mastra/observability` 1.24.3, `MastraPlatformExporter`).
          excludeSpanTypes: [SpanType.MODEL_CHUNK],
          // Mastra keeps the first 50 items of a list (`@mastra/observability` 1.24.3
          // `dist/index.js:454-465`): a long conversation's step would lose its newest messages,
          // the ones a provider refusal is about.
          serializationOptions: { maxArrayLength: MESSAGES_KEPT },
        },
      },
    }),
  })
}
