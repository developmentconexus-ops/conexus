import type { HostLabel } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { AppsDomain } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { readyDatabaseOf, recordDatabaseHost } from './company-database.ts'
import {
  deleteCompanyProjects,
  hasCompanyDatabase,
  releaseCompanyDatabase,
} from './company-deletion.ts'
import { admitToApp, liveProjectOf, projectOfHost } from './hosts.ts'
import type { AppRemoval } from './projects.ts'
import { createProjectStore, deleteMarkedProject, markedProjectsOf } from './projects.ts'
import { registerProjectRoutes } from './routes.ts'

/** For the apps' removal, which Projects and the Central call before Projects exist to hand it. */
export { readyDatabaseOf } from './company-database.ts'
export type { AppRemoval } from './projects.ts'
/** For the apps' foreign key alone (code C8). */
export { project } from './tables.ts'
export type Projects = ReturnType<typeof createProjects>
export type ProjectPorts = Projects['ports']

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
}) {
  const store = createProjectStore(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerProjectRoutes(app, store),
    // What the Operations Central reaches Projects through when it deletes a company (code C4).
    ports: Object.freeze({
      hasCompanyDatabase,
      releaseCompanyDatabase: (input: Parameters<typeof hasCompanyDatabase>[1]) =>
        releaseCompanyDatabase(deps, input),
      deleteCompanyProjects,
      // What the apps' door reaches Projects through: a host's Projeto, and who may open it now.
      projectOfHost: (label: HostLabel) => projectOfHost(deps.database, label),
      admitToApp: (input: Parameters<typeof admitToApp>[1]) => admitToApp(deps, input),
      // What the apps' versions reach Projects through: the Projeto, and its company's database.
      liveProjectOf,
      readyDatabaseOf,
      recordDatabaseHost,
      // What the apps' repair at start reaches Projects through: the Projetos marked for deletion.
      markedProjectsOf,
      deleteMarkedProject,
    }),
  })
}
