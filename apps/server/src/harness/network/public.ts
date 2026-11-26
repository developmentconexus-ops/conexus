import type { FastifyInstance } from 'fastify'
import { registerNetworkRoutes } from './routes.ts'
import { createNetworkStore } from './store.ts'

export type { NetworkStore } from './store.ts'

/** The company's domain list, each conversation's, and the whole-internet switch. */
export function createNetwork(deps: Parameters<typeof createNetworkStore>[0]) {
  const store = createNetworkStore(deps)
  return Object.freeze({
    store,
    routes: (app: FastifyInstance) => registerNetworkRoutes(app, store),
  })
}
