import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database, MastraPool } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import type { openGoogleCalls } from '../model-accounts/public.ts'
import { createBuilder } from './builder.ts'
import { registerConversationRoutes } from './routes.ts'
import { Sessions } from './sessions.ts'
import type { ReleaseScope } from './store.ts'
import { createConversationStore } from './store.ts'

export type { ReleaseScope } from './store.ts'
/** Deletes the threads, and so the memory, of a Projeto, a person or a company (data D17). */
export type ReleaseConversations = (scope: ReleaseScope) => Promise<void>
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
  const builder = createBuilder({ pool: deps.pool, queue, log: deps.log })
  const store = createConversationStore(deps)
  const sessions = new Sessions({ builder, log: deps.log })

  const release: ReleaseConversations = async (scope) => {
    const ids = await store.releasedIds(scope)
    for (const id of ids) {
      await sessions.forget(id)
      await builder.memory.deleteThread(id)
    }
    deps.log.info({ companyId: scope.companyId, count: ids.length }, 'CONVERSATIONS_RELEASED')
  }

  return Object.freeze({
    routes: (app: FastifyInstance) =>
      registerConversationRoutes(app, { store, sessions, builder, queue }),
    release,
    /** Mastra's tables, made once at start by its own login (decision 0010). */
    async prepare() {
      await builder.mastra.getStorage()?.init()
      deps.log.info({}, 'MASTRA_STORAGE_READY')
    },
    /** Waits for the turns in progress, then stops Mastra and Google's calls (code C62). */
    async close() {
      await sessions.drain()
      await builder.mastra.shutdown()
      await deps.google.stop()
    },
  })
}
