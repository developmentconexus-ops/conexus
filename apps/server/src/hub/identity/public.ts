import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { SendMail } from '../../platform/mail.ts'
import { createAuth, libraryCommandOn } from './auth.ts'
import { registerCompanyRoutes } from './company-routes.ts'
import { createFirstPerson } from './first-person.ts'
import { registerIdentityRoutes } from './routes.ts'
import { createSessionReader } from './session.ts'

// The library's own configuration, for its tests: nothing routes to its sign-up, so only a direct
// call can prove the sign-up stays closed (criterion 18).
export { createAuth } from './auth.ts'
export { passwordLinkText } from './messages.ts'

export type Identity = ReturnType<typeof createIdentity>

export function createIdentity(deps: {
  database: Database
  config: Config
  log: FailureLog
  sendMail: SendMail
}) {
  const auth = createAuth(deps)
  const libraryCommand = libraryCommandOn(auth, deps.database)
  const readSession = createSessionReader({ auth })
  return Object.freeze({
    readSession,
    firstPerson: createFirstPerson({
      auth,
      libraryCommand,
      publicOrigin: deps.config.publicOrigin,
    }),
    routes: (app: Parameters<typeof registerIdentityRoutes>[0]) => {
      registerIdentityRoutes(app, { auth, config: deps.config, readSession })
      registerCompanyRoutes(app, { ...deps, auth, libraryCommand })
    },
  })
}
