import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database, MastraPool } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { registerSourceRoutes } from '../git/public.ts'
import type { openGoogleCalls } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { createBuilder } from './builder.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import { registerConversationRoutes } from './routes.ts'
import { Sessions } from './sessions.ts'
import type { ReleaseScope } from './store.ts'
import { createConversationStore } from './store.ts'

export { TOOL_CLOSURE }

/** Deletes the threads, and so the memory, of a Projeto, a person or a company (data D17). */
type ReleaseConversations = (scope: ReleaseScope) => Promise<void>
export type Conversations = ReturnType<typeof createConversations>

/**
 * The Builder's conversations (decision 0050): the index in the Hub's database says whose each
 * thread is, and Mastra keeps their words in its own (decision 0010).
 */
export function createConversations(deps: {
  database: Database
  identity: IdentityPorts
  projects: Pick<ProjectPorts, 'liveProjectOf'>
  sealKeys: SealKeys
  google: ReturnType<typeof openGoogleCalls>
  pool: MastraPool
  runs: Runs
  log: FailureLog
}) {
  const { database, identity, sealKeys } = deps
  const queue = {
    database,
    identity,
    sealKeys,
    googleCalls: deps.google.googleCalls,
    log: deps.log,
  }
  const store = createConversationStore(deps)
  const builder = createBuilder({
    ...{ pool: deps.pool, queue, runs: deps.runs, index: store, log: deps.log },
    projectName: (ids) =>
      database.read({ kind: 'COMPANY', companyId: ids.companyId, personId: null }, async (tx) => {
        return (await deps.projects.liveProjectOf(tx, ids))?.name
      }),
  })
  const sessions = new Sessions({
    builder,
    runs: deps.runs,
    log: deps.log,
  })

  const release: ReleaseConversations = async (scope) => {
    const ids = await store.releasedIds(scope)
    // The runs first: a turn the removal aborts then finds its run gone and writes nothing. Its
    // Mastra run is aborted before the kill, so no tool starts the machine again; a thread goes
    // only once its machine is killed.
    await deps.runs.stopWriting(scope)
    for (const id of ids) await sessions.forget(id)
    await deps.runs.release(scope, ids)
    for (const id of ids) await builder.memory.deleteThread(id)
    deps.log.info({ companyId: scope.companyId, count: ids.length }, 'CONVERSATIONS_RELEASED')
  }

  return Object.freeze({
    routes: (app: FastifyInstance) => {
      registerConversationRoutes(app, { store, sessions, builder, queue })
      registerSourceRoutes(app, {
        ...{ database, identity, projects: deps.projects },
        repository: (ids) => deps.runs.repositoryOf(ids),
      })
    },
    release,
    /** Mastra's tables, made once at start by its own login (decision 0010). */
    async prepare() {
      const storage = builder.mastra.getStorage()
      if (storage === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'MASTRA_STORAGE_MISSING' } })
      }
      await storage.init()
      deps.log.info({}, 'MASTRA_STORAGE_READY')
    },
    /**
     * Waits for the turns in progress and for the memory's work after them, such as a buffered
     * observation, which still reads the pool `main.ts` ends next; then stops Mastra and Google's
     * calls (code C62).
     */
    async close() {
      await sessions.drain()
      deps.runs.stop()
      await builder.memory.settled()
      await builder.mastra.shutdown()
      await deps.google.stop()
    },
  })
}
