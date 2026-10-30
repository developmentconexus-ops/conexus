import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import { createAppVersions } from './app-versions.ts'
import type { AppDeps } from './handoff.ts'
import { createAppDoor, endAppSessions } from './handoff.ts'
import type { Ungranted } from './live.ts'
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
import { publishedRolesOf } from './versions.ts'

/** How long a send's answer waits for its prune: a test of the send names it. */
export { PRUNE_BUDGET_MS } from './prune.ts'
/** What a Projeto's page reads of its app: the Prévia's and the published version (step 17). */
export { versionNumbersOf } from './versions.ts'

export type Apps = ReturnType<typeof createApps>
export type { ConnectorCall } from './handoff.ts'
export type { Ungranted } from './live.ts'

/**
 * What Projects asks of the apps for who uses them: the published version's roles, and the end of a
 * person's sessions once their access is taken, after the commit (step 18, D and S13).
 */
export function appAccessOf(database: Database) {
  return Object.freeze({
    publishedRolesOf,
    endAppSessions: (ids: Parameters<typeof endAppSessions>[1]) =>
      endAppSessions({ database }, ids),
  })
}

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
 * call (decision 0041), and the versions every member's Builder turn sends (decision 0043, step
 * 14.1), which every member lists and publishes. It reaches identity and Projects only
 * through their ports (code C4), Neon and Cloudflare only through the ports `main.ts` hands it (C56).
 */
export function createApps(deps: AppDeps & RepairDeps & { ungranted: Ungranted }) {
  const door = createAppDoor(deps)
  const versions = createAppVersions(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => {
      registerHandoffRoute(app, door)
      registerVersionRoutes(app, versions)
    },
    edgeRoutes: (edge: FastifyInstance) => registerEdgeRoutes(edge, door),
    /** What the connectors' door asks of an app call: who, the version the session gets and its manifest (step 20). */
    connectorCall: door.connectorCall,
    /** One pass over the companies' apps at start (architecture §8). */
    repair: () => repairApps(deps),
    /** Where a Builder turn's version goes to the Projeto's app (step 14.1). */
    sendFromBuilder: versions.sendFromBuilder,
  })
}
