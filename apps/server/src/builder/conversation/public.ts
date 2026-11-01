import type { ServerResponse } from 'node:http'
import { ASSISTANT_CONTROLLER } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { AnyWorkflow } from '@mastra/core/workflows'
import type { PostgresStore } from '@mastra/pg'
import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { BuilderConnectors } from '../connectors/public.ts'
import { registerSourceRoutes } from '../git/public.ts'
import type { openGoogleCalls, QueueDeps } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import type { Builder } from './builder.ts'
import { BUILDER_ID, createBuilder } from './builder.ts'
import { watchRuns } from './end.ts'
import type { AssistantAdmission } from './guard.ts'
import { registerBuilderRoutes } from './guard.ts'
import { createMastra } from './mastra.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import { registerConversationRoutes } from './routes.ts'
import type { ReleaseScope } from './store.ts'
import { createConversationStore } from './store.ts'

export {
  conversationMemory,
  MODEL_TIMEOUT,
  sessionModel,
  toolsOf,
} from './builder.ts'
export { failureOf, modelFailure } from './end.ts'
export { skillOf } from './instructions.ts'
export { workspaceMetadataLive } from './processors.ts'
export { turnDate } from './prompt/prompt.ts'
export { createMastraStorage } from './storage.ts'
export type { ReleaseScope } from './store.ts'
export { bodyHashOf } from './store.ts'
export { TurnTally } from './turn-line.ts'
export { ownerOfResource, turnOfOwner } from './turn-of.ts'
export { TOOL_CLOSURE }

/**
 * What the Assistant hands the conversations (step 24.1, U2): its controller beside the Builder's in
 * the one `Mastra`, its memory, the removal of its threads and its end.
 */
export type AssistantPart = {
  controller: AgentController
  memory: Builder['memory']
  release(scope: ReleaseScope): Promise<void>
  close(): Promise<void>
}

/**
 * What the automations hand the conversations (step 24.2): their workflows on the one `Mastra`, a
 * test's short scheduler tick, and their removal, which runs before the conversations'.
 */
export type AutomationPart = {
  workflows: Readonly<Record<string, AnyWorkflow>>
  schedulerTickMs: number | undefined
  release(scope: ReleaseScope): Promise<void>
}

/** Deletes the threads, and so the memory, of a Projeto, a person or a company (data D17). */
type ReleaseConversations = (scope: ReleaseScope) => Promise<void>
export type Conversations = ReturnType<typeof createConversations>

/** Admits the person who may ask the Assistant now, the guard's check for its conversations. */
function askerAdmission(database: Database, identity: IdentityPorts): AssistantAdmission {
  return ({ person, companyId }) =>
    database.read({ kind: 'COMPANY', companyId, personId: person.id }, async (tx) => {
      await identity.admitMember({ tx, personId: person.id, companyId, action: 'askAssistant' })
    })
}

/**
 * The removal of a Projeto's, a person's or a company's conversations, after their automations.
 * The runs first: a turn the removal aborts then finds its run gone and writes nothing. Its Mastra
 * run is aborted before the kill (`deleteSession` aborts it and denies its cards), so no tool starts
 * the machine again; a thread goes only once its machine is killed.
 */
function releaseOf(deps: {
  store: ReturnType<typeof createConversationStore>
  builder: Builder
  runs: Runs
  assistant: AssistantPart
  automation: AutomationPart
  log: FailureLog
}): ReleaseConversations {
  const { store, builder, assistant } = deps
  return async (scope) => {
    await deps.automation.release(scope)
    const ids = await store.releasedIds(scope)
    await deps.runs.stopWriting(scope)
    for (const id of ids) await builder.controller.deleteSession({ sessionId: id })
    await deps.runs.release(scope, ids)
    for (const id of ids) await builder.memory.deleteThread(id)
    deps.log.info({ companyId: scope.companyId, count: ids.length }, 'CONVERSATIONS_RELEASED')
    await assistant.release(scope)
  }
}

/**
 * The Builder's conversations (decision 0050): the index in the Hub's database says whose each
 * thread is, and Mastra keeps their words in its own (decision 0010).
 */
export function createConversations(deps: {
  database: Database
  identity: IdentityPorts
  projects: Pick<ProjectPorts, 'liveProjectOf'>
  google: ReturnType<typeof openGoogleCalls>
  storage: PostgresStore
  queue: QueueDeps
  runs: Runs
  connectors: BuilderConnectors
  assistant: AssistantPart
  automation: AutomationPart
  log: FailureLog
}) {
  const { database, identity, queue, assistant, automation } = deps
  const store = createConversationStore(deps)
  const builder = createBuilder({
    ...{
      storage: deps.storage,
      queue,
      runs: deps.runs,
      index: store,
      connectors: deps.connectors,
    },
    projectName: (ids) =>
      database.read({ kind: 'COMPANY', companyId: ids.companyId, personId: null }, async (tx) => {
        return (await deps.projects.liveProjectOf(tx, ids))?.name
      }),
  })
  const mastra = createMastra({
    storage: deps.storage,
    log: deps.log,
    controllers: { [BUILDER_ID]: builder.controller, [ASSISTANT_CONTROLLER]: assistant.controller },
    workflows: automation.workflows,
    schedulerTickMs: automation.schedulerTickMs,
  })
  const runs = watchRuns({
    watched: [
      {
        ...{ controller: builder.controller, memory: builder.memory },
        finish: (input) => deps.runs.finish(input),
        onPhase: (conversationId, listener) => deps.runs.onPhase(conversationId, listener),
      },
      // The Assistant's turn writes in no Projeto: its end saves only the failure it said.
      assistant,
    ],
    log: deps.log,
  })
  const mayAsk = askerAdmission(database, identity)
  const streams = new Set<ServerResponse>()

  const release = releaseOf({ ...deps, store, builder })

  return Object.freeze({
    /** The one `Mastra`, which the automations schedule on (step 24.2). */
    mastra,
    /** True from `settle` on: nothing new starts (the guard's `HUB_UPDATING`, an automation's run). */
    updating: runs.updating,
    routes: (app: FastifyInstance) => {
      registerConversationRoutes(app, { store, builder, queue })
      registerBuilderRoutes(app, {
        ...{ mastra, store, builder, mayAsk, streams, log: deps.log },
        updating: runs.updating,
      })
      registerSourceRoutes(app, {
        ...{ database, identity, projects: deps.projects },
        repository: (ids) => deps.runs.repositoryOf(ids),
      })
    },
    release,
    /** Mastra's tables, made once at start by its own login (decision 0010). */
    async prepare() {
      const storage = mastra.getStorage()
      if (storage === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_STORAGE_MISSING' } })
      }
      await storage.init()
      deps.log.info({}, 'MASTRA_STORAGE_READY')
    },
    /**
     * Mastra's workers, after every subject is made: the orchestration that runs the workflows,
     * and the scheduler only if a schedule row exists (`NM:mastra-Da0Czfte.js:5037-5049`).
     */
    async start(): Promise<void> {
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
     * Stops the runs in progress of both controllers, as Parar does, and closes the open streams once each said its end;
     * then waits for the memory's work after them, such as a buffered
     * observation, which still reads the pool `main.ts` ends next; then stops Mastra and Google's
     * calls (code C62).
     */
    async close() {
      await runs.drain()
      // Mastra's adapter stops writing on the response's close (`@mastra/fastify` `stream`).
      for (const stream of streams) stream.destroy()
      deps.runs.stop()
      await assistant.close()
      await builder.memory.settled()
      await mastra.shutdown()
      await deps.google.stop()
    },
  })
}
