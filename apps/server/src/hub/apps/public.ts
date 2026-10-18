import type { FastifyInstance } from 'fastify'
import { createAppVersions } from './app-versions.ts'
import type { AppDeps } from './handoff.ts'
import { createAppDoor } from './handoff.ts'
import { registerEdgeRoutes, registerHandoffRoute, registerVersionRoutes } from './routes.ts'
import type { SendDeps } from './send.ts'

export type Apps = ReturnType<typeof createApps>

/**
 * The app of a Projeto: the pass the Hub gives a person, what the apps' dispatcher asks on each
 * call (decision 0041), and the versions an owner or administrator sends (decision 0043). It
 * reaches identity and Projects only through their ports (code C4), Neon and Cloudflare only
 * through the ports `main.ts` hands it (C56).
 */
export function createApps(deps: AppDeps & SendDeps) {
  const door = createAppDoor(deps)
  const versions = createAppVersions(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => {
      registerHandoffRoute(app, door)
      registerVersionRoutes(app, versions)
    },
    edgeRoutes: (edge: FastifyInstance) => registerEdgeRoutes(edge, door),
  })
}
