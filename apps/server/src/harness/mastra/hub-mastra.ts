import type { ServerResponse } from 'node:http'
import type { CompanyId, ConversationId, Person } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { AnyWorkflow } from '@mastra/core/workflows'
import type { Memory } from '@mastra/memory'
import type { FastifyInstance } from 'fastify'
import type { FailureLog } from '../../platform/failure.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { GuardedMastra, MayApprove, WriteOf } from '../routes/public.ts'
import { registerSessionRoutes } from '../routes/public.ts'
import type { ControllerKind, ModelSource, ReleaseScope, RunMark } from '../spec/public.ts'
import { CONTROLLER_KINDS } from '../spec/public.ts'
import type { TurnEnds, Watched } from '../turn/public.ts'
import { watchRuns } from '../turn/public.ts'
import { createMastra } from './mastra.ts'
import { RETENTION_WORKFLOW, retentionOf, storageOf } from './retention.ts'

/** A conversation controller on the one `Mastra`, with what the Hub does to its conversations. */
export type Part = {
  kind: ControllerKind
  controller: AgentController
  memory: Watched['memory'] & Pick<Memory, 'getThreadById' | 'settled'>
  /** Whose model the conversation runs, from its ficha: the guard switches only the session's. */
  model: ModelSource
  /**
   * The door of the six routes, at each request: the owner is already checked by the thread, and
   * its marks against it (`markIn`); `NOT_FOUND` becomes `CONVERSATION_NOT_FOUND`.
   */
  admit(input: {
    person: Person
    companyId: CompanyId
    conversationId: ConversationId
    mark: RunMark
  }): Promise<void>
  /** The connection and operation of the write a tool of the conversation is (step 24.5), for the log of an answer. */
  writeOf?: WriteOf
  /** Whether the person answering a write's card holds that write in their role (step 24.5, D3-a). */
  mayApprove?: MayApprove
  release(scope: ReleaseScope): Promise<void>
  /** The controller's own end of a turn (`finish`, `refusal`, `onPhase`); without it, `watchRuns` keeps only the failure it said. */
  ends?: TurnEnds
  /** What must exist before the scheduler wakes. */
  beforeWorkers?(): Promise<void>
  close?(): Promise<void>
}

/**
 * The Hub's one `Mastra` and the order around it (step 24.3, U1b): Mastra registers the
 * controllers and workflows (`new Mastra({ agentControllers, workflows })`), and the order to
 * start, stop and remove is ours, since `mastra.shutdown` hands the thread runs back aborted, their
 * partial response unsaved, and waits for no controller's end
 * (`@mastra/core` 1.86.0 `mastra-CqBmnzjM.js:6209-6235,5885-5900`). Each module is registered in
 * one place, as n8n's module manifest (`packages/cli/src/modules/modules.manifest.ts:6-17` at
 * `2e855356`) and activepieces' `app.ts` (`packages/server/api/src/app/app.ts:236-250` at
 * `f34c43cd`) do. `parts` is in the order of removal and of `close`.
 */
export function createHubMastra(deps: {
  storage: MastraCompositeStore
  /** The account queue, which the guard asks whether the person has an account for a model they switch to. */
  queue: QueueDeps
  log: FailureLog
  parts: readonly Part[]
  workflows: Readonly<Record<string, AnyWorkflow>>
  schedulerTickMs: number | undefined
  /** What leaves before the conversations: the automations (24.2) and the agents (24.3). */
  releaseFirst: readonly ((scope: ReleaseScope) => Promise<void>)[]
  /** What runs at start before the workers: the connections' copy clocks made to match their copies. */
  startFirst: readonly (() => Promise<void>)[]
  /** What stops after `Mastra`: Google's calls (code C62). */
  closeLast: readonly (() => Promise<void>)[]
}) {
  const { parts, log } = deps
  const mastra = createMastra({
    ...{ storage: deps.storage, log },
    workflows: { ...deps.workflows, [RETENTION_WORKFLOW]: retentionOf({ log }) },
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

  const streams = new Set<ServerResponse>()
  function part(kind: ControllerKind): Part | undefined {
    return parts.find((each) => each.kind === kind)
  }
  const guarded: GuardedMastra = { mastra, part, updating: runs.updating }

  return Object.freeze({
    /** The one `Mastra`, which the automations schedule on (step 24.2). */
    mastra,
    /** The controller a route's path names, as the guard consults it. */
    part,
    /** True from `settle` on: nothing new starts (the guard's `HUB_UPDATING`, an automation's run). */
    updating: runs.updating,
    /** Mastra's session routes of every controller, behind the guard, which asks the controller a path names. */
    routes: (app: FastifyInstance) =>
      registerSessionRoutes(app, { hub: guarded, streams, queue: deps.queue, log }),
    /** The removal of a Projeto's, a person's or a company's conversations, after what leaves first. */
    async release(scope: ReleaseScope): Promise<void> {
      for (const first of deps.releaseFirst) await first(scope)
      for (const each of parts) await each.release(scope)
    },
    /** Mastra's tables, made once at start by its own login (decision 0010). */
    async prepare(): Promise<void> {
      await storageOf(mastra).init()
      log.info({}, 'MASTRA_STORAGE_READY')
    },
    /**
     * Mastra's workers, after every subject is made: the orchestration that runs the workflows,
     * and the scheduler, which starts since the retention workflow always leaves a schedule row
     * (`@mastra/core` 1.86.0 `mastra-CqBmnzjM.js:4941-4956,5680-5700`).
     */
    async start(): Promise<void> {
      for (const each of parts) await each.beforeWorkers?.()
      for (const first of deps.startFirst) await first()
      await mastra.startWorkers()
      log.info({}, 'MASTRA_WORKERS_STARTED')
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
     * Stops the runs in progress of every controller, as Parar does, closes the open streams, then
     * each part's own end (the Builder's runs); then waits for the memory's work after them,
     * such as a buffered observation, which still reads the pool `main.ts` ends next; then stops
     * Mastra and what closes last (code C62).
     */
    async close(): Promise<void> {
      await runs.drain()
      // Mastra's adapter stops writing on the response's close (`@mastra/fastify` `stream`).
      for (const stream of streams) stream.destroy()
      for (const each of parts) await each.close?.()
      for (const each of parts) await each.memory.settled()
      await mastra.shutdown()
      for (const last of deps.closeLast) await last()
    },
  })
}
