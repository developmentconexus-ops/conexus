import type { CompanyData } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Principal } from '../access/public.ts'
import type { DataDeps } from './deps.ts'
import type { ReadsDeps } from './reads.ts'
import type { DataContext } from './recorded.ts'
import { recordedData, sourcesFor } from './recorded.ts'
import { registerDataReadRoutes } from './routes.ts'

export type { DataDeps, TurnBinding } from './deps.ts'
export type { ReadsDeps } from './reads.ts'
export { recordReadOf as recordRead } from './record.ts'
export type { DataContext } from './recorded.ts'

/** The Registro de dados on the screens' routes (U8). */
export function createDataReads(deps: ReadsDeps) {
  return { routes: (app: FastifyInstance) => registerDataReadRoutes(app, deps) }
}

/** The access contract bound to who asks and where, as the access door's principal. */
export function createCompanyData(
  deps: DataDeps,
): (principal: Principal, context: DataContext) => CompanyData {
  return (principal, context) =>
    recordedData(deps, principal, context, sourcesFor(deps, principal, context), () => new Date())
}
