import type { ConversationId } from '@conexus/hub-api'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { FastifyInstance } from 'fastify'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { Owner, ReleaseScope } from '../../harness/spec/public.ts'
import { resourceOf } from '../../harness/spec/public.ts'
import type { ConnectorPort } from '../../harness/tools/public.ts'
import type { BuilderData } from '../../hub/apps/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { createBuilder } from './builder.ts'
import { builderEnds } from './end.ts'
import { registerSourceRoutes } from './git/source.ts'
import { created, registerConversationRoutes } from './routes.ts'
import type { Runs } from './runs/runs.ts'
import { createConversationStore } from './store.ts'

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
 * (`harness/mastra/`), whose close ends the open streams, and its routes beside Mastra's.
 */
export function createBuilderConversations(deps: {
  database: Database
  identity: IdentityPorts
  projects: Pick<ProjectPorts, 'liveProjectOf'>
  storage: MastraCompositeStore
  queue: QueueDeps
  runs: Runs
  connectors: ConnectorPort
  data: BuilderData
  companyData: Parameters<typeof createBuilder>[0]['companyData']
  access: Parameters<typeof createBuilder>[0]['access']
  log: FailureLog
}) {
  const { database, identity, queue } = deps
  const store = createConversationStore(deps)
  const builder = createBuilder({
    ...{ storage: deps.storage, queue, runs: deps.runs, log: deps.log },
    ...{ index: store, connectors: deps.connectors, data: deps.data },
    ...{ companyData: deps.companyData, access: deps.access },
    projectName: (ids) =>
      database.read({ kind: 'COMPANY', companyId: ids.companyId, personId: null }, async (tx) => {
        return (await deps.projects.liveProjectOf(tx, ids))?.name
      }),
  })

  return Object.freeze({
    part: {
      kind: 'builder',
      controller: builder.controller,
      memory: builder.memory,
      admit: (input: Parameters<typeof store.mine>[0]) => store.mine(input),
      release: releaseOf({ ...deps, store, builder }),
      ends: builderEnds(deps.runs),
      /** The runs' own work, after the open streams the Hub closed (code C62). */
      async close(): Promise<void> {
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
    routes: (app: FastifyInstance) => {
      registerConversationRoutes(app, { store, builder, queue })
      registerSourceRoutes(app, {
        ...{ database, identity, projects: deps.projects },
        repository: (ids) => deps.runs.repositoryOf(ids),
      })
    },
  } as const)
}
