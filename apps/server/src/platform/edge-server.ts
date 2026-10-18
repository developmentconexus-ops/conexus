import type { FastifyInstance } from 'fastify'
import { enforceAccess } from './access.ts'
import type { Config } from './config.ts'
import { baseServer, installErrorHandling } from './http.ts'

/**
 * The listener on `HUB_EDGE_PORT`, which only the apps' dispatcher reaches through Workers VPC
 * (decision 0041): its `edge` routes and nothing else, no page and no session.
 */
export async function createEdgeServer(config: Config): Promise<FastifyInstance> {
  const app = await baseServer(config)
  enforceAccess(app, { kind: 'EDGE' })
  installErrorHandling(app, { built: false })
  return app
}
