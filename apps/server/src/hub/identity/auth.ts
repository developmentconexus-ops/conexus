import { AsyncLocalStorage } from 'node:async_hooks'
import * as libraryContext from '@better-auth/core/context'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import type { FailureCode } from '@conexus/hub-api'
import { PASSWORD_LENGTH } from '@conexus/hub-api'
import { betterAuth } from 'better-auth'
import { admin, organization } from 'better-auth/plugins'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Config } from '../../platform/config.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { mayCreateCompanies } from './admission.ts'
import {
  account,
  company,
  invitation,
  member,
  rateLimit,
  session,
  user,
  verification,
} from './tables.ts'

export const SIGN_IN_PATH = '/sign-in/email'
export const RESET_PASSWORD_PATH = '/reset-password'
const BASE_PATH = '/api/auth'
export const LIFETIMES = { idleSeconds: 1800, renewAfterSeconds: 60, totalSeconds: 8 * 60 * 60 }
const SIGN_IN_ATTEMPTS = { window: 60, max: 10 }
const PASSWORD_LINK_SECONDS = 900
// The founder's numbers, step 4 answers 4 and 6.
const INVITATION_SECONDS = 2 * 24 * 60 * 60
const COMPANY_CAPACITY = 100

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
  if (deliver === undefined) throw new Error('a password link was asked outside linkTokenOf')
  deliver(token)
}

const ErrorStatus = z.object({ statusCode: z.number().int() })

export function statusOf(error: unknown): number {
  const status = ErrorStatus.safeParse(error)
  return status.success ? status.data.statusCode : 500
}

const LibraryRefusal = z.object({ body: z.object({ code: z.string() }) })

/**
 * Runs a library call inside a command: a refusal the library names by its code becomes the Hub's
 * failure (code C52), and any other error goes on to the command, which maps it.
 */
export async function refusedAs<T>(
  work: () => Promise<T>,
  refusals: Partial<Record<string, FailureCode>>,
): Promise<T> {
  try {
    return await work()
  } catch (error) {
    const refusal = LibraryRefusal.safeParse(error)
    if (!refusal.success) throw error
    const reason = refusal.data.body.code
    const code = refusals[reason]
    if (code === undefined) throw error
    throw new Failure(code, { details: { reason }, cause: error })
  }
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
    schema: { user, session, account, verification, rateLimit, company, member, invitation },
    // The library spends a reset link before it writes the password; one transaction keeps both (D22).
    transaction: true,
  })
}

export type LibraryCommand = <T>(work: (tx: CommandTx) => Promise<T>) => Promise<T>

/**
 * One command the library joins: it runs on our transaction as its own, so the plugin's accept,
 * which opens a transaction of its own, writes there too instead of on another connection (D22).
 */
export function libraryCommandOn(auth: Auth, database: Database): LibraryCommand {
  return (work) =>
    database.command(
      async (tx) =>
        await libraryContext.runWithTransaction(adapterFor(tx)(auth.options), () => work(tx)),
    )
}

/**
 * An earlier link of the same person stops working when a new one is given (C64). The library
 * stores each link under a hash of its token, so only the person's id, the stored value, finds it.
 */
export async function forgetLinks(tx: CommandTx, personId: string): Promise<void> {
  await tx.execute(sql`delete from auth.verification where value = ${personId}`)
}

const KEY_FIELD = { type: 'string', required: true } as const

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
    // The router would print an error it cannot answer, row values and all, to stderr (the
    // `# SERVER_ERROR` line of better-call's dist/router.mjs); thrown, it reaches inLibrary and
    // leaves as a code (S41).
    onAPIError: { throw: true },
    plugins: [
      organization({
        schema: {
          organization: { modelName: 'company', additionalFields: { attemptKey: KEY_FIELD } },
          invitation: { additionalFields: { attemptKey: KEY_FIELD } },
        },
        allowUserToCreateOrganization: (person) => mayCreateCompanies(person.role),
        // The Hub counts the open invitations itself, under the company's lock: the plugin reads
        // at most 100 rows of them, in no order (docs/reference/boundaries.md).
        invitationLimit: Number.POSITIVE_INFINITY,
        invitationExpiresIn: INVITATION_SECONDS,
        membershipLimit: COMPANY_CAPACITY,
      }),
      admin(),
    ],
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
