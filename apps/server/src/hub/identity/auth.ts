import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { account, rateLimit, session, user, verification } from './tables.ts'

export const SIGN_IN_PATH = '/sign-in/email'
const BASE_PATH = '/api/auth'
export const LIFETIMES = { idleSeconds: 1800, renewAfterSeconds: 60 }
const SIGN_IN_ATTEMPTS = { window: 60, max: 10 }
const PASSWORD_LENGTH = { min: 8, max: 128 }

// The library logs without the request; a sign-in runs inside this store so its lines carry the trace id.
const requestLog = new AsyncLocalStorage<FailureLog>()

export function withRequestLog<T>(log: FailureLog, work: () => Promise<T>): Promise<T> {
  return requestLog.run(log, work)
}

function hostCookie(name: string) {
  return { name: `__Host-conexus_${name}`, attributes: { secure: true } }
}

export function createAuth(deps: { database: Database; config: Config; log: FailureLog }) {
  return betterAuth({
    appName: 'Conexus',
    basePath: BASE_PATH,
    baseURL: deps.config.publicOrigin,
    secret: deps.config.sessionSecret.reveal(),
    database: drizzleAdapter(deps.database.libraryOrm(), {
      provider: 'pg',
      schema: { user, session, account, verification, rateLimit },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: PASSWORD_LENGTH.min,
      maxPasswordLength: PASSWORD_LENGTH.max,
    },
    session: {
      expiresIn: LIFETIMES.idleSeconds,
      updateAge: LIFETIMES.renewAfterSeconds,
      cookieCache: { enabled: false },
    },
    verification: { storeIdentifier: 'hashed' },
    rateLimit: {
      enabled: true,
      storage: 'database',
      customRules: { [SIGN_IN_PATH]: SIGN_IN_ATTEMPTS },
    },
    advanced: {
      // __Host- comes from the names below; the library would otherwise prefix __Secure-.
      useSecureCookies: false,
      cookies: {
        session_token: hostCookie('session'),
        session_data: hostCookie('session_data'),
        dont_remember: hostCookie('dont_remember'),
      },
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
    },
    telemetry: { enabled: false },
    logger: {
      // Only a code leaves: the library's messages and arguments can hold an e-mail or an error (S41).
      log: (level) => {
        const log = requestLog.getStore() ?? deps.log
        if (level === 'error') log.error({ level }, 'AUTH_LIBRARY_ERROR')
        else log.info({ level }, 'AUTH_LIBRARY_NOTICE')
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
