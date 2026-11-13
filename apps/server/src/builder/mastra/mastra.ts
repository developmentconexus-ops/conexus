import type { AgentController } from '@mastra/core/agent-controller'
import { Mastra } from '@mastra/core/mastra'
import { SpanType } from '@mastra/core/observability'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { AnyWorkflow, SchedulerConfig } from '@mastra/core/workflows'
import { MastraStorageExporter, Observability } from '@mastra/observability'
import type { FailureLog } from '../../platform/failure.ts'
import { BuilderLogger } from './logger.ts'

/** The messages of a step the trace keeps whole. */
const MESSAGES_KEPT = 500

/** Mastra's scheduler, its publish failures (after its own retries) in the central log under a code of ours. */
export function schedulerOf(log: FailureLog, tickMs: number | undefined) {
  const config = {
    ...(tickMs === undefined ? {} : { tickIntervalMs: tickMs }),
    onError: (_error, context) =>
      log.error({ scheduleId: context.scheduleId }, 'SCHEDULE_PUBLISH_FAILED'),
  } satisfies SchedulerConfig
  return config
}

/**
 * The Hub's one `Mastra` (step 24.1, H1): every controller under its key, as Mastra's routes name
 * them (`/agent-controller/<key>/…`), and every workflow under its id (step 24.2), on one store and
 * one logger. Its scheduler ticks at Mastra's own interval unless a test shortens it.
 * Its traces, logs and metrics go to Mastra's own database (decision 0068); Mastra adds its
 * `SensitiveDataFilter` as the last span processor by itself.
 */
export function createMastra(deps: {
  storage: MastraCompositeStore
  log: FailureLog
  controllers: Readonly<Record<string, AgentController>>
  workflows: Readonly<Record<string, AnyWorkflow>>
  schedulerTickMs: number | undefined
}): Mastra {
  const mastra = new Mastra({
    logger: new BuilderLogger(deps.log),
    storage: deps.storage,
    agentControllers: { ...deps.controllers },
    workflows: { ...deps.workflows },
    scheduler: schedulerOf(deps.log, deps.schedulerTickMs),
    observability: new Observability({
      configs: {
        default: {
          serviceName: 'conexus-hub',
          exporters: [new MastraStorageExporter()],
          // One row per streamed chunk says nothing a step does not; Mastra's own platform exporter
          // drops them too (`@mastra/observability` 1.23.1, `MastraPlatformExporter`).
          excludeSpanTypes: [SpanType.MODEL_CHUNK],
          // Mastra keeps the first 50 items of a list (`dist/index.js:455-460`): a long conversation's
          // step would lose its newest messages, the ones a provider refusal is about.
          serializationOptions: { maxArrayLength: MESSAGES_KEPT },
        },
      },
    }),
  })
  // Mastra 1.82.0 gives its logger to the store but not to the store's domains, which log their own
  // failures; each domain takes it by the same `__setLogger` (code C50). Revisit on an upgrade.
  for (const domain of Object.values(deps.storage.stores ?? {}))
    domain?.__setLogger(mastra.getLogger())
  return mastra
}
