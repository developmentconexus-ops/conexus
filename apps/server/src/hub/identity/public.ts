import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { createAuth, LIFETIMES } from './auth.ts'
import { createFirstPerson } from './first-person.ts'
import { registerIdentityRoutes } from './routes.ts'
import { createSessionReader } from './session.ts'

export type Identity = ReturnType<typeof createIdentity>

export function createIdentity(deps: { database: Database; config: Config; log: FailureLog }) {
  const auth = createAuth(deps)
  return Object.freeze({
    readSession: createSessionReader({ auth, database: deps.database, lifetimes: LIFETIMES }),
    firstPerson: createFirstPerson({
      auth,
      database: deps.database,
      publicOrigin: deps.config.publicOrigin,
    }),
    routes: (app: Parameters<typeof registerIdentityRoutes>[0]) =>
      registerIdentityRoutes(app, { auth, config: deps.config }),
  })
}
