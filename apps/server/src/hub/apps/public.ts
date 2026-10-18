import type { FastifyInstance } from 'fastify'
import { createAppVersions } from './app-versions.ts'
import type { AppDeps } from './handoff.ts'
import { createAppDoor } from './handoff.ts'
import type { RemovalDeps } from './removal.ts'
import {
  claimForDeletion,
  deleteCompanyBlobs,
  removeCompanyWorkers,
  removeProjectApp,
} from './removal.ts'
import type { RepairDeps } from './repair.ts'
import { repairApps } from './repair.ts'
import { registerEdgeRoutes, registerHandoffRoute, registerVersionRoutes } from './routes.ts'

/** How long a send's answer waits for its prune: a test of the send names it. */
export { PRUNE_BUDGET_MS } from './prune.ts'

export type Apps = ReturnType<typeof createApps>

/**
 * How deleting a Projeto, or a client, removes its apps: Workers, schemas and logins before rows
 * (code C8). It needs no other subject, so `main.ts` makes it first and hands it to both.
 */
export function createAppRemoval(deps: RemovalDeps) {
  return Object.freeze({
    claimForDeletion,
    removeProjectApp: (input: Parameters<typeof removeProjectApp>[1]) =>
      removeProjectApp(deps, input),
    removeCompanyWorkers: (input: Parameters<typeof removeCompanyWorkers>[1]) =>
      removeCompanyWorkers(deps, input),
    deleteCompanyBlobs,
  })
}

/**
 * The app of a Projeto: the pass the Hub gives a person, what the apps' dispatcher asks on each
 * call (decision 0041), and the versions an owner or administrator sends (decision 0043). It
 * reaches identity and Projects only through their ports (code C4), Neon and Cloudflare only
 * through the ports `main.ts` hands it (C56).
 */
export function createApps(deps: AppDeps & RepairDeps) {
  const door = createAppDoor(deps)
  const versions = createAppVersions(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => {
      registerHandoffRoute(app, door)
      registerVersionRoutes(app, versions)
    },
    edgeRoutes: (edge: FastifyInstance) => registerEdgeRoutes(edge, door),
    /** One pass over the companies' apps at start (architecture §8). */
    repair: () => repairApps(deps),
  })
}
