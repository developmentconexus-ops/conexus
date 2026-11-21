import { exportDataReads, listDataReads } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { ReadsDeps } from './reads.ts'
import { exportDataReads as exportReads, listDataReads as listReads } from './reads.ts'

/** The Registro de dados: each route admits the person by `readDataReads` before it reads (S10). */
export function registerDataReadRoutes(app: FastifyInstance, deps: ReadsDeps): void {
  serve(app, listDataReads, async ({ person, params, query }) => {
    const { page, ...filters } = query
    return answer(await listReads(deps, { ...params, personId: person.id, filters, page }))
  })
  serve(app, exportDataReads, async ({ person, params, query }) => {
    const { from, to, ...filters } = query
    return answer(await exportReads(deps, { ...params, personId: person.id, filters, from, to }))
  })
}
