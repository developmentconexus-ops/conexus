import type { HostLabel } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { AppsDomain } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { projectAppsOf } from './app-access.ts'
import { nameDatabases, readyDatabaseOf, recordDatabaseHost } from './company-database.ts'
import {
  deleteCompanyProjects,
  hasCompanyDatabase,
  releaseCompanyDatabase,
} from './company-deletion.ts'
import { admitToApp, liveProjectNamesOf, liveProjectOf, projectOfHost } from './hosts.ts'
import { finishMarkedProject, markedProjectsOf } from './marked.ts'
import type {
  AppRemoval,
  AppSessionsEnd,
  AppVersionsOf,
  ProjectConversationRelease,
  PublishedRolesOf,
  PublishRequestOf,
} from './ports.ts'
import { createProjectStore } from './projects.ts'
import { registerProjectRoutes } from './routes.ts'

/** For the apps' removal, which Projects and the Central call before Projects exist to hand it. */
export { readyDatabaseOf } from './company-database.ts'
/** For the Builder's conversations, made before Projects to hand Projects their release. */
export { liveProjectOf } from './hosts.ts'
export type {
  AppRemoval,
  AppSessionsEnd,
  AppVersionsOf,
  ProjectConversationRelease,
  PublishedRolesOf,
  PublishRequestOf,
} from './ports.ts'
/** The name a notice shows (code C8); the table itself leaves by `public-tables.ts`. */
export { projectNameColumn } from './tables.ts'
export type ProjectPorts = ReturnType<typeof createProjects>['ports']

/** Neon's release as a resource outside the Hub: a deletion still waiting is `PENDING`, not a failure. */
async function databaseLeft(
  deps: Parameters<typeof releaseCompanyDatabase>[0],
  input: Parameters<typeof releaseCompanyDatabase>[1],
): Promise<'GONE' | 'PENDING'> {
  try {
    await releaseCompanyDatabase(deps, input)
    return 'GONE'
  } catch (error) {
    if (error instanceof Failure && error.code === 'CLIENT_DELETION_PENDING') return 'PENDING'
    throw error
  }
}

/**
 * The Projects of a company and its database in Neon. It reaches identity only through its ports
 * (code C4), and Neon only through the port `main.ts` hands it (code C56).
 */
export function createProjects(deps: {
  database: Database
  identity: IdentityPorts
  neon: NeonProjects
  log: FailureLog
  appsDomain: AppsDomain
  appRemoval: AppRemoval
  appVersionsOf: AppVersionsOf
  publishRequestOf: PublishRequestOf
  releaseConversations: ProjectConversationRelease
  publishedRolesOf: PublishedRolesOf
  endAppSessions: AppSessionsEnd
}) {
  const store = createProjectStore(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerProjectRoutes(app, store, deps),
    /** What an app's invitation reaches Projects through, handed to identity's routes (step 18). */
    appInvitations: projectAppsOf(deps),
    /** One pass at start: each company's Neon project takes its `<nickname>-<companyId>` (0048). */
    nameDatabases: () => nameDatabases(deps),
    // What the Operations Central reaches Projects through when it deletes a company (code C4).
    ports: Object.freeze({
      // The company's database in Neon, a resource outside the Hub that deleting its client frees.
      companyDatabase: Object.freeze({
        has: hasCompanyDatabase,
        release: (input: Parameters<typeof hasCompanyDatabase>[1]) => databaseLeft(deps, input),
      }),
      deleteCompanyProjects,
      // What the apps' door reaches Projects through: a host's Projeto, and who may open it now.
      projectOfHost: (label: HostLabel) => projectOfHost(deps.database, label),
      admitToApp: (input: Parameters<typeof admitToApp>[1]) => admitToApp(deps, input),
      // What the Assistant's hand-off reaches Projects through (step 24.3.2): the creation the route
      // makes, keyed by the same attempt.
      createProject: (input: Parameters<typeof store.create>[0]) => store.create(input),
      // What the apps' versions reach Projects through: the Projeto, and its company's database.
      liveProjectOf,
      liveProjectNamesOf,
      readyDatabaseOf,
      recordDatabaseHost,
      // What the apps' repair at start reaches Projects through: the Projetos marked for deletion.
      markedProjectsOf,
      finishMarkedProject: (input: Parameters<typeof finishMarkedProject>[1]) =>
        finishMarkedProject(deps, input),
    }),
  })
}
