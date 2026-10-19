import type { FastifyInstance } from 'fastify'
import type { Database } from '../../platform/database.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { ProjectPorts } from '../projects/public.ts'
import type { CompanyAppRemoval, CompanyConversationRelease } from './clients.ts'
import { createClients } from './clients.ts'
import { registerClientRoutes } from './routes.ts'

export type { CompanyConversationRelease } from './clients.ts'
export type Operations = ReturnType<typeof createOperations>

/**
 * The Operations Central: Conexus's record of its clients, which reaches identity only through its
 * ports, so it could leave this program behind an API of the product (step 4.2, T4).
 */
export function createOperations(deps: {
  database: Database
  identity: IdentityPorts
  projects: ProjectPorts
  appRemoval: CompanyAppRemoval
  releaseConversations: CompanyConversationRelease
}) {
  const clients = createClients(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) =>
      registerClientRoutes(app, { clients, identity: deps.identity }),
  })
}
