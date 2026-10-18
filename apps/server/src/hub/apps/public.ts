import type { FastifyInstance } from 'fastify'
import type { AppDeps } from './handoff.ts'
import { createAppDoor } from './handoff.ts'
import { registerEdgeRoutes, registerHandoffRoute } from './routes.ts'

export type Apps = ReturnType<typeof createApps>

/**
 * The door of a Projeto's app on its host: the pass the Hub gives a person, and what the apps'
 * dispatcher asks on each call (decision 0041). It reaches identity and Projects only through their
 * ports (code C4).
 */
export function createApps(deps: AppDeps) {
  const door = createAppDoor(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerHandoffRoute(app, door),
    edgeRoutes: (edge: FastifyInstance) => registerEdgeRoutes(edge, door),
  })
}
