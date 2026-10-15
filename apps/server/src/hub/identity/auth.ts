import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { PASSWORD_LENGTH } from '@conexus/hub-api'
import { betterAuth } from 'better-auth'
import { z } from 'zod'
import type { Config } from '../../platform/config.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { account, rateLimit, session, user, verification } from './tables.ts'

export const SIGN_IN_PATH = '/sign-in/email'
export const RESET_PASSWORD_PATH = '/reset-password'
const BASE_PATH = '/api/auth'
const LIFETIMES = { idleSeconds: 1800, renewAfterSeconds: 60 }
const SIGN_IN_ATTEMPTS = { window: 60, max: 10 }
const PASSWORD_LINK_SECONDS = 900

// The library logs without the request; a sign-in runs inside this store so its lines carry the trace id.
const requestLog = new AsyncLocalStorage<FailureLog>()

export function withRequestLog<T>(log: FailureLog, work: () => Promise<T>): Promise<T> {
  return requestLog.run(log, work)
}

// The one-use link goes back to the command that asked for it, never to an e-mail or a log (S35).
const linkDelivery = new AsyncLocalStorage<(token: string) => void>()

/** Runs `work`, which asks the library for a reset link, and returns the token it delivered. */
export async function linkTokenOf(work: () => Promise<unknown>): Promise<string> {
  let token: string | undefined
  await linkDelivery.run((given) => {
    token = given
  }, work)
  if (token === undefined)
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'no link' } })
  return token
}

async function deliverLink({ token }: { token: string }): Promise<void> {
  const deliver = linkDelivery.getStore()
  if (deliver === undefined) throw new Error('a password link was asked outside first-person')
  deliver(token)
}

const ErrorStatus = z.object({ statusCode: z.number().int() })

export function statusOf(error: unknown): number {
  const status = ErrorStatus.safeParse(error)
  return status.success ? status.data.statusCode : 500
}

/**
 * Runs a call into the library. Its one outside system is the database, so a failure it cannot
 * name, such as a 500 that dropped its cause, is the database's (code C50, C52).
 */
export async function inLibrary<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    const failure = databaseFailure(error)
    if (failure.code !== 'INTERNAL_UNEXPECTED' || statusOf(error) < 500) throw failure
    throw new Failure('DATABASE_UNAVAILABLE', { cause: error })
  }
}

function adapterFor(db: Parameters<typeof drizzleAdapter>[0]) {
  return drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification, rateLimit },
  })
}

/** The library's adapter on one of our transactions, so its writes join that unit of work. */
export function adapterOn(auth: Auth, tx: CommandTx) {
  return adapterFor(tx)(auth.options)
}

// No secure attribute: better-call sets Secure on every __Host- name (dist/cookies.mjs:48-49).
function hostCookie(name: string) {
  return { name: `__Host-conexus_${name}` }
}

export function createAuth(deps: { database: Database; config: Config; log: FailureLog }) {
  return betterAuth({
    appName: 'Conexus',
    basePath: BASE_PATH,
    baseURL: deps.config.publicOrigin,
    secret: deps.config.sessionSecret.reveal(),
    database: adapterFor(deps.database.libraryOrm()),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: PASSWORD_LENGTH.min,
      maxPasswordLength: PASSWORD_LENGTH.max,
      resetPasswordTokenExpiresIn: PASSWORD_LINK_SECONDS,
      sendResetPassword: deliverLink,
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
        if (level === 'error') log.error({ libraryLevel: level }, 'AUTH_LIBRARY_ERROR')
        else log.info({ libraryLevel: level }, 'AUTH_LIBRARY_NOTICE')
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
