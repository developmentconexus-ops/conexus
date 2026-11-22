import { createClientLake, deleteClientLake, getClientLake } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { createLake } from './lake.ts'

/** The lake's three routes in the Central, only the operator's (decision A, security S10). */
export function registerLakeRoutes(app: FastifyInstance, lakes: ReturnType<typeof createLake>) {
  serve(app, getClientLake, async ({ person, params }) =>
    answer({ lake: await lakes.read({ person: person.id, companyId: params.companyId }) }),
  )
  serve(app, createClientLake, async ({ person, params }) =>
    answer({ lake: await lakes.create({ person: person.id, companyId: params.companyId }) }),
  )
  serve(app, deleteClientLake, async ({ person, params, body }) =>
    answer({
      lake: await lakes.remove({ person: person.id, companyId: params.companyId, name: body.name }),
    }),
  )
}
