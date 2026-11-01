import type { AgentController } from '@mastra/core/agent-controller'
import { Mastra } from '@mastra/core/mastra'
import type { AnyWorkflow } from '@mastra/core/workflows'
import type { PostgresStore } from '@mastra/pg'
import type { FailureLog } from '../../platform/failure.ts'
import { BuilderLogger } from './logger.ts'

/**
 * The Hub's one `Mastra` (step 24.1, H1): every controller under its key, as Mastra's routes name
 * them (`/agent-controller/<key>/…`), and every workflow under its id (step 24.2), on one store and
 * one logger. Its scheduler ticks at Mastra's own interval unless a test shortens it.
 */
export function createMastra(deps: {
  storage: PostgresStore
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
    ...(deps.schedulerTickMs === undefined
      ? {}
      : { scheduler: { tickIntervalMs: deps.schedulerTickMs } }),
  })
  // Mastra 1.79.0 gives its logger to the store but not to the store's domains, which log their own
  // failures; each domain takes it by the same `__setLogger` (code C50). Revisit on an upgrade.
  for (const domain of Object.values(deps.storage.stores)) domain?.__setLogger(mastra.getLogger())
  return mastra
}
