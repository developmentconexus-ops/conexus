import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { reseal } from './reseal.ts'
import { registerModelAccountRoutes } from './routes.ts'
import { createModelAccountStore } from './store.ts'

export type ModelAccounts = ReturnType<typeof createModelAccounts>

/**
 * The model accounts of each company and of its people (decision 0049). It reaches identity only
 * through its ports (code C4); `main.ts` hands them over with the installation's seal keys.
 */
export function createModelAccounts(deps: {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
}) {
  const store = createModelAccountStore(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerModelAccountRoutes(app, { ...deps, store }),
  })
}

/** The `reseal` command's work: every account on the key that seals, and how many moved. */
export function resealModelAccounts(deps: { database: Database; sealKeys: SealKeys }) {
  return reseal(deps)
}
