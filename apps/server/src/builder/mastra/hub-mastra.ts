import type { CompanyId, ConversationId, Person } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { AnyWorkflow } from '@mastra/core/workflows'
import type { PostgresStore } from '@mastra/pg'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { ControllerKind, ReleaseScope } from '../controller-kit/public.ts'
import { CONTROLLER_KINDS } from '../controller-kit/public.ts'
import type { Watched } from '../conversation/public.ts'
import { watchRuns } from '../conversation/public.ts'
import { createMastra } from './mastra.ts'

/** A conversation controller on the one `Mastra`, with what the Hub does to its conversations. */
type Part = {
  kind: ControllerKind
  controller: AgentController
  memory: Watched['memory']
  /**
   * The door of the six routes, at each request: the owner is already checked by the thread;
   * `NOT_FOUND` becomes `CONVERSATION_NOT_FOUND`.
   */
  admit(input: {
    person: Person
    companyId: CompanyId
    conversationId: ConversationId
  }): Promise<void>
  release(scope: ReleaseScope): Promise<void>
  /** The Builder's end of a turn (`finish`, `onPhase`); without it, `watchRuns` keeps only the failure it said. */
  ends?: Pick<Watched, 'finish' | 'onPhase'>
  /** What must exist before the scheduler wakes. */
  beforeWorkers?(): Promise<void>
  close?(): Promise<void>
}

/**
 * The Hub's one `Mastra` and the order around it (step 24.3, U1b): Mastra registers the
 * controllers and workflows (`new Mastra({ agentControllers, workflows })`), and the order to
 * start, stop and remove is ours, since `mastra.shutdown` drains no controller
 * (`NM:mastra-Da0Czfte.js:5521-5551`). Each module is registered in one place, as n8n's module
 * manifest (`packages/cli/src/modules/modules.manifest.ts:6-17` at `2e855356`) and activepieces'
 * `app.ts` (`packages/server/api/src/app/app.ts:236-250` at `f34c43cd`) do. `parts` is in the
 * order of removal and of `close`.
 */
export function createHubMastra(deps: {
  storage: PostgresStore
  log: FailureLog
  parts: readonly Part[]
  workflows: Readonly<Record<string, AnyWorkflow>>
  schedulerTickMs: number | undefined
  /** What leaves before the conversations: the automations (24.2) and the agents (24.3). */
  releaseFirst: readonly ((scope: ReleaseScope) => Promise<void>)[]
  /** What stops after `Mastra`: Google's calls (code C62). */
  closeLast: readonly (() => Promise<void>)[]
}) {
  const { parts, log } = deps
  const mastra = createMastra({
    ...{ storage: deps.storage, log, workflows: deps.workflows },
    controllers: Object.fromEntries(
      parts.map((part) => [CONTROLLER_KINDS[part.kind].id, part.controller]),
    ),
    schedulerTickMs: deps.schedulerTickMs,
  })
  const runs = watchRuns({
    watched: parts.map((part) => ({
      ...{ controller: part.controller, memory: part.memory },
      ...part.ends,
    })),
    log,
  })

  return Object.freeze({
    /** The one `Mastra`, which the automations schedule on (step 24.2). */
    mastra,
    /** The controller a route's path names, as the guard consults it. */
    part: (kind: ControllerKind): Part | undefined => parts.find((each) => each.kind === kind),
    /** True from `settle` on: nothing new starts (the guard's `HUB_UPDATING`, an automation's run). */
    updating: runs.updating,
    /** The removal of a Projeto's, a person's or a company's conversations, after what leaves first. */
    async release(scope: ReleaseScope): Promise<void> {
      for (const first of deps.releaseFirst) await first(scope)
      for (const part of parts) await part.release(scope)
    },
    /** Mastra's tables, made once at start by its own login (decision 0010). */
    async prepare(): Promise<void> {
      const storage = mastra.getStorage()
      if (storage === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_STORAGE_MISSING' } })
      }
      await storage.init()
      log.info({}, 'MASTRA_STORAGE_READY')
    },
    /**
     * Mastra's workers, after every subject is made: the orchestration that runs the workflows,
     * and the scheduler only if a schedule row exists (`NM:mastra-Da0Czfte.js:5037-5049`).
     */
    async start(): Promise<void> {
      for (const part of parts) await part.beforeWorkers?.()
      await mastra.startWorkers()
    },
    /**
     * Stops the scheduler, so no automation fires after the signal, then refuses new turns and
     * waits for the ones in flight, until `bound` aborts (founder E1).
     */
    async settle(bound: AbortSignal): Promise<void> {
      await mastra.getWorker('scheduler')?.stop()
      await runs.settle(bound)
    },
    /**
     * Stops the runs in progress of every controller, as Parar does, then each part's own end (the
     * Builder's open streams once each said its end); then waits for the memory's work after them,
     * such as a buffered observation, which still reads the pool `main.ts` ends next; then stops
     * Mastra and what closes last (code C62).
     */
    async close(): Promise<void> {
      await runs.drain()
      for (const part of parts) await part.close?.()
      for (const part of parts) await part.memory.settled()
      await mastra.shutdown()
      for (const last of deps.closeLast) await last()
    },
  })
}
