import type { FastifyInstance } from 'fastify'
import type { LakeDeps } from './lake.ts'
import { createLake } from './lake.ts'
import { registerLakeRoutes } from './routes.ts'

export { settle } from './settle.ts'

/**
 * A company's data lake (card o-lago-da-empresa-nasce-e-some): its row in the Hub and its stack in
 * AWS, reached only through `LakeStacks` (C56), and the lake as a resource outside the Hub when its
 * client is deleted (card L.13).
 */
export function createLakes(deps: LakeDeps) {
  const lakes = createLake(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerLakeRoutes(app, lakes),
    outside: lakes.outside,
  })
}
