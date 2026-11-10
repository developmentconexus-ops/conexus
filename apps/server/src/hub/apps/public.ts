import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import type { AppDataDeps } from './app-data.ts'
import { createAppData } from './app-data.ts'
import { appDatabaseOf, readAppData } from './app-database.ts'
import { appTablesOf } from './app-tables.ts'
import { createAppVersions } from './app-versions.ts'
import type { AppDeps } from './handoff.ts'
import { createAppDoor, endAppSessions } from './handoff.ts'
import type { PublishDeps } from './live.ts'
import type { RemovalDeps } from './removal.ts'
import {
  claimForDeletion,
  deleteCompanyBlobs,
  removeCompanyWorkers,
  removeProjectApp,
} from './removal.ts'
import type { RepairDeps } from './repair.ts'
import { repairApps } from './repair.ts'
import {
  registerDataRoutes,
  registerEdgeRoutes,
  registerHandoffRoute,
  registerVersionRoutes,
} from './routes.ts'
import { publishedRolesOf } from './versions.ts'

/** What a Projeto's page reads of its app: the Prévia's and the published version (step 17). */
export { publishedVersionsOf, versionNumbersOf } from './versions.ts'

export type Apps = ReturnType<typeof createApps>
export type { AppRead, SqlStatement } from '../../platform/company-postgres.ts'
export type { AppTablesRead } from './app-tables.ts'
export type { ConnectorCall } from './handoff.ts'
export type { CloseRequests, PublishDeps, PublishInput, Ungranted } from './live.ts'
/**
 * What a request to publish reaches the apps through (step 24.3.4): the app's lock, the kept version
 * it names, and the publish a decision makes.
 */
export { publishIn } from './live.ts'
export { keptVersionOf, lockApp } from './versions.ts'

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
 * 14.1), which every member lists and an owner, an administrator or a developer publishes. It
 * reaches identity and Projects only through their ports (code C4), Neon and Cloudflare only
 * through the ports `main.ts` hands it (C56).
 */
export function createApps(
  deps: AppDeps & RepairDeps & Omit<PublishDeps, 'log'> & Pick<AppDataDeps, 'callDeadlineMs'>,
) {
  const door = createAppDoor(deps)
  const versions = createAppVersions(deps)
  const data = createAppData(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => {
      registerHandoffRoute(app, door)
      registerVersionRoutes(app, versions)
      registerDataRoutes(app, data)
    },
    edgeRoutes: (edge: FastifyInstance) => registerEdgeRoutes(edge, door),
    /** What the connectors' door asks of an app call: who, the version the session gets and its manifest (step 20). */
    connectorCall: door.connectorCall,
    /** One pass over the companies' apps at start (architecture §8). */
    repair: () => repairApps(deps),
    /** Where a Builder turn's version goes to the Projeto's app (step 14.1). */
    sendFromBuilder: versions.sendFromBuilder,
    /** What a Projeto's agents read of its app's data, and whether it has an app to read (step 24.3, U3). */
    readAppData: (input: Parameters<typeof readAppData>[1]) => readAppData(deps, input),
    /** The app's tables with their columns, one list for the Dados page and the Construtor. */
    appTables: (input: Parameters<typeof appTablesOf>[1]) => appTablesOf(deps, input),
    hasAppData: async (input: Parameters<typeof appDatabaseOf>[1]) =>
      (await appDatabaseOf(deps, input)) !== undefined,
  })
}
