import type { ServerResponse } from 'node:http'
import type { ConversationId } from '@conexus/hub-api'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { FastifyInstance } from 'fastify'
import type { BuilderData } from '../../hub/apps/public.ts'
import type { CopyService } from '../../hub/copies/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { BuilderConnectors } from '../connectors/public.ts'
import type { Owner, ReleaseScope } from '../controller-kit/public.ts'
import { resourceOf } from '../controller-kit/public.ts'
import { registerSourceRoutes } from '../git/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { OntologyDoor } from '../ontology/public.ts'
import type { Runs } from '../runs/public.ts'
import { createBuilder } from './builder.ts'
import type { GuardedMastra } from './guard.ts'
import { registerBuilderRoutes } from './guard.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import { created, registerConversationRoutes } from './routes.ts'
import { createConversationStore } from './store.ts'

export type { Watched } from './end.ts'
export { failureOf, modelFailure, watchRuns } from './end.ts'
export type { GuardedMastra, MayApprove, WriteOf } from './guard.ts'
export { approvedCallOf } from './guard.ts'
export { skillOf } from './instructions.ts'
export { ASK_USER_TOOL, createAskUserTool } from './plan-tools.ts'
export { turnDate } from './prompt/prompt.ts'
export { createMastraStorage } from './storage.ts'
export { TurnTally } from './turn-line.ts'
export { TOOL_CLOSURE }

/**
 * The removal of the Builder's conversations of a Projeto, a person or a company, after their
 * automations and their agents. The runs first: a turn the removal aborts then finds its run gone
 * and writes nothing. Its Mastra run is aborted before the kill (`deleteSession` aborts it and
 * denies its cards), so no tool starts the machine again; a thread goes only once its machine is
 * killed.
 */
function releaseOf(deps: {
  store: ReturnType<typeof createConversationStore>
  builder: ReturnType<typeof createBuilder>
  runs: Runs
  log: FailureLog
}) {
  const { store, builder } = deps
  return async (scope: ReleaseScope): Promise<void> => {
    const ids = await store.releasedIds(scope)
    await deps.runs.stopWriting(scope)
    for (const id of ids) await builder.controller.deleteSession({ sessionId: id })
    await deps.runs.release(scope, ids)
    for (const id of ids) await builder.memory.deleteThread(id)
    deps.log.info({ companyId: scope.companyId, count: ids.length }, 'CONVERSATIONS_RELEASED')
  }
}

/**
 * The Builder's conversations (decision 0050): the index in the Hub's database says whose each
 * thread is, and Mastra keeps their words in its own (decision 0010). Its part on the one `Mastra`
 * (`builder/mastra/`), whose close ends the open streams, and its routes beside Mastra's.
 */
export function createBuilderConversations(deps: {
  database: Database
  identity: IdentityPorts
  projects: Pick<ProjectPorts, 'liveProjectOf'>
  storage: MastraCompositeStore
  queue: QueueDeps
  runs: Runs
  connectors: BuilderConnectors
  ontology: OntologyDoor
  data: BuilderData
  copies: Pick<CopyService, 'projectView'>
  log: FailureLog
}) {
  const { database, identity, queue } = deps
  const store = createConversationStore(deps)
  const builder = createBuilder({
    ...{ storage: deps.storage, queue, runs: deps.runs, log: deps.log },
    ...{ index: store, connectors: deps.connectors, ontology: deps.ontology, data: deps.data },
    copies: (ids) => deps.copies.projectView(ids),
    projectName: (ids) =>
      database.read({ kind: 'COMPANY', companyId: ids.companyId, personId: null }, async (tx) => {
        return (await deps.projects.liveProjectOf(tx, ids))?.name
      }),
  })
  const streams = new Set<ServerResponse>()

  return Object.freeze({
    part: {
      kind: 'builder',
      controller: builder.controller,
      memory: builder.memory,
      admit: (input: Parameters<typeof store.mine>[0]) => store.mine(input),
      release: releaseOf({ ...deps, store, builder }),
      ends: {
        finish: (input: Parameters<Runs['finish']>[0]) => deps.runs.finish(input),
        onPhase: (...args: Parameters<Runs['onPhase']>) => deps.runs.onPhase(...args),
      },
      /** The open streams once each said its end, then the runs' own work (code C62). */
      async close(): Promise<void> {
        // Mastra's adapter stops writing on the response's close (`@mastra/fastify` `stream`).
        for (const stream of streams) stream.destroy()
        deps.runs.stop()
      },
    },
    /**
     * What the Assistant's hand-off reaches the Builder through (step 24.3.2): a conversation of the
     * Projeto opened by its attempt, as the route opens one, and whether it holds a message yet.
     */
    handOffs: {
      open: (input: Parameters<typeof created>[1]) => created({ store, builder, queue }, input),
      async asked(owner: Owner, conversationId: ConversationId): Promise<boolean> {
        const { messages } = await builder.memory.recall({
          threadId: conversationId,
          resourceId: resourceOf('builder', owner),
          perPage: 1,
        })
        return messages.length > 0
      },
    },
    routes: (app: FastifyInstance, hub: GuardedMastra) => {
      registerConversationRoutes(app, { store, builder, queue })
      registerBuilderRoutes(app, { hub, builder, streams, log: deps.log })
      registerSourceRoutes(app, {
        ...{ database, identity, projects: deps.projects },
        repository: (ids) => deps.runs.repositoryOf(ids),
      })
    },
  } as const)
}
