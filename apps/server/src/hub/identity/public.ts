import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { createAuth } from './auth.ts'
import { createFirstPerson } from './first-person.ts'
import { registerIdentityRoutes } from './routes.ts'
import { createSessionReader } from './session.ts'

// The library's own configuration, for its tests: nothing routes to its sign-up, so only a direct
// call can prove the sign-up stays closed (criterion 18).
export { createAuth } from './auth.ts'

export type Identity = ReturnType<typeof createIdentity>

export function createIdentity(deps: { database: Database; config: Config; log: FailureLog }) {
  const auth = createAuth(deps)
  const readSession = createSessionReader({ auth })
  return Object.freeze({
    readSession,
    firstPerson: createFirstPerson({
      auth,
      database: deps.database,
      publicOrigin: deps.config.publicOrigin,
    }),
    routes: (app: Parameters<typeof registerIdentityRoutes>[0]) =>
      registerIdentityRoutes(app, { auth, config: deps.config, readSession }),
  })
}
