import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { NeonProjects } from '../../platform/neon.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { createProjectStore } from './projects.ts'
import { registerProjectRoutes } from './routes.ts'

export type Projects = ReturnType<typeof createProjects>

/**
 * The Projects of a company and its database in Neon. It reaches identity only through its ports
 * (code C4), and Neon only through the port `main.ts` hands it (code C56).
 */
export function createProjects(deps: {
  database: Database
  identity: IdentityPorts
  neon: NeonProjects
  log: FailureLog
}) {
  const store = createProjectStore(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerProjectRoutes(app, store),
  })
}
