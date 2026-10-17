import { AsyncLocalStorage } from 'node:async_hooks'
import type { GenericEndpointContext } from '@better-auth/core'
import * as libraryContext from '@better-auth/core/context'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import type { FailureCode, PersonId } from '@conexus/hub-api'
import { CAPACITY, COOKIE_PREFIX, PASSWORD_LENGTH, SESSION_COOKIE } from '@conexus/hub-api'
import { betterAuth } from 'better-auth'
import { createAuthEndpoint } from 'better-auth/api'
import { admin, organization } from 'better-auth/plugins'
import type { OrganizationOptions } from 'better-auth/plugins/organization'
import { getOrgAdapter } from 'better-auth/plugins/organization'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { CLIENT_ADDRESS_HEADER } from '../../platform/access.ts'
import type { Config } from '../../platform/config.ts'
import type { CommandTx, Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { statusOf } from '../../platform/http.ts'
import {
  account,
  company,
  invitation,
  member,
  rateLimit,
  relations,
  session,
  user,
  verification,
} from './tables.ts'

export const SIGN_IN_PATH = '/sign-in/email'
export const RESET_PASSWORD_PATH = '/reset-password'
const BASE_PATH = '/api/auth'
export const INVITATION_PASSWORD_PATH = '/invitation-password-attempt'
export const INVITATION_DECLINATION_PATH = '/invitation-declination-attempt'
const INVITATION_ATTEMPTS = {
  id: 'invitation-attempts',
  endpoints: {
    invitationPasswordAttempt: createAuthEndpoint(
      INVITATION_PASSWORD_PATH,
      { method: 'POST' },
      async () => new Response(null, { status: 204 }),
    ),
    invitationDeclinationAttempt: createAuthEndpoint(
      INVITATION_DECLINATION_PATH,
      { method: 'POST' },
      async () => new Response(null, { status: 204 }),
    ),
  },
}
const LIFETIMES = { idleSeconds: 1800, renewAfterSeconds: 60, totalSeconds: 8 * 60 * 60 }
const SIGN_IN_ATTEMPTS = { window: 60, max: 10 }
export const PASSWORD_LINK_SECONDS = 900
// The founder's number, step 4 answer 4.
const INVITATION_SECONDS = 2 * 24 * 60 * 60

/** When an invitation renewed now ends, as the plugin computes it for a new one (`getDate`). */
export function invitationExpiry(): Date {
  return new Date(Date.now() + INVITATION_SECONDS * 1000)
}

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

/** The Hub's code for each library refusal a call expects, by the library's code or by status. */
type Refusals = Partial<Record<string, FailureCode>>
const RefusalBody = z.object({ code: z.string() })
const Thrown = z.object({ body: z.unknown() })

/** One reader of a refusal, thrown by `auth.api` or answered by `auth.handler` (code C52). */
function refusalOf(refusals: Refusals, status: number, body: unknown) {
  const named = RefusalBody.safeParse(body)
  const reason = named.success ? named.data.code : String(status)
  const code = (named.success ? refusals[named.data.code] : undefined) ?? refusals[status]
  return code === undefined ? undefined : { code, reason }
}

/**
 * Runs a library call inside a command: a refusal the call names becomes the Hub's failure, and
 * any other error goes on to the command, which maps it.
 */
export async function refusedAs<T>(work: () => Promise<T>, refusals: Refusals): Promise<T> {
  try {
    return await work()
  } catch (error) {
    const thrown = Thrown.safeParse(error)
    const refusal = refusalOf(refusals, statusOf(error), thrown.success ? thrown.data.body : null)
    if (refusal === undefined) throw error
    throw new Failure(refusal.code, { details: { reason: refusal.reason }, cause: error })
  }
}

/**
 * The failure of a reply `auth.handler` refused: a refusal the call names, else a malformed request,
 * or the database for a 5xx, its one outside system.
 */
export async function refusedReply(reply: Response, refusals: Refusals): Promise<Failure> {
  const body: unknown = await reply.json().catch(() => null)
  const refusal = refusalOf(refusals, reply.status, body)
  if (refusal !== undefined)
    return new Failure(refusal.code, { details: { reason: refusal.reason } })
  return new Failure(reply.status < 500 ? 'REQUEST_MALFORMED' : 'DATABASE_UNAVAILABLE')
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
    database.libraryCommand(
      relations,
      async (tx) =>
        await libraryContext.runWithTransaction(adapterFor(tx)(auth.options), () => work(tx)),
    )
}

/**
 * An earlier link of the same person stops working when a new one is given (C64). The library
 * stores each link under a hash of its token, so only the person's id, the stored value, finds it.
 */
export async function forgetLinks(tx: CommandTx, personId: string): Promise<void> {
  await tx.delete(verification).where(eq(verification.value, personId))
}

const CredentialRow = z.object({ password: z.string().min(1).nullable() }).nullable()

/** An address as the library stores it: it lowercases every e-mail it writes. */
export function storedAddress(email: string): string {
  return email.toLowerCase()
}

/** Inside a library command, it reads in the command's transaction. */
export async function hasPassword(auth: Auth, personId: PersonId): Promise<boolean> {
  const { internalAdapter } = await auth.$context
  const account = CredentialRow.parse(await internalAdapter.findCredentialAccount(personId))
  return Boolean(account?.password)
}

const KEY_FIELD = { type: 'string', required: true } as const
// Left out of the plugin's request body (db/to-zod.mjs:17), so only the Hub's mark sets it.
const MAILED_FIELD = { type: 'date', required: false, input: false } as const

const ORGANIZATION = {
  schema: {
    organization: { modelName: 'company', additionalFields: { attemptKey: KEY_FIELD } },
    invitation: { additionalFields: { attemptKey: KEY_FIELD, mailedAt: MAILED_FIELD } },
  },
  // Only the Operations Central creates a company, through the adapter (step 4.2).
  allowUserToCreateOrganization: false,
  // The Hub counts the open invitations itself, under the company's lock: the plugin reads
  // at most 100 rows of them, in no order (docs/reference/boundaries.md).
  invitationLimit: Number.POSITIVE_INFINITY,
  invitationExpiresIn: INVITATION_SECONDS,
  membershipLimit: CAPACITY.members,
} satisfies OrganizationOptions

/**
 * The plugin's own adapter, inside a library command: it writes a company and an invitation as its
 * endpoints do, without their check that the caller is a member. The Hub's admission decides
 * instead, for members and the operator alike (docs/reference/boundaries.md).
 */
export async function organizationAdapter(auth: Auth) {
  const context = await auth.$context
  // @ts-expect-error: better-auth 1.7.8 types the parameter AuthContext<BetterAuthOptions>, which no configured auth's context matches, its options being invariant there; the adapter reads only context.adapter (organization/adapter.mjs:126).
  return getOrgAdapter(context, ORGANIZATION)
}

/**
 * A renewal never moves a session past 8 h from its creation, the founder's total. `getSession`
 * renews after placing the session it read on the context
 * (`better-auth/dist/api/routes/session.mjs:154`).
 */
async function capAtTotalLifetime(
  data: { expiresAt?: Date },
  context: GenericEndpointContext | null,
) {
  const createdAt = context?.context.session?.session.createdAt
  if (data.expiresAt === undefined || createdAt === undefined) return
  const end = endOfLifetime(createdAt)
  return { data: { expiresAt: new Date(Math.min(data.expiresAt.getTime(), end)) } }
}

/** The instant a session created at `createdAt` ends, whatever its idle deadline says. */
export function endOfLifetime(createdAt: Date): number {
  return createdAt.getTime() + LIFETIMES.totalSeconds * 1000
}

// No secure attribute: better-call sets Secure on every __Host- name (dist/cookies.mjs:48-49).
function hostCookie(name: string) {
  return { name: `${COOKIE_PREFIX}${name}` }
}

export function createAuth(deps: { database: Database; config: Config; log: FailureLog }) {
  return betterAuth({
    appName: 'Conexus',
    basePath: BASE_PATH,
    baseURL: deps.config.publicOrigin,
    secret: deps.config.sessionSecret.reveal(),
    database: adapterFor(deps.database.libraryOrm(relations)),
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
    databaseHooks: { session: { update: { before: capAtTotalLifetime } } },
    verification: { storeIdentifier: 'hashed' },
    rateLimit: {
      enabled: true,
      storage: 'database',
      customRules: {
        [SIGN_IN_PATH]: SIGN_IN_ATTEMPTS,
        [INVITATION_PASSWORD_PATH]: SIGN_IN_ATTEMPTS,
        [INVITATION_DECLINATION_PATH]: SIGN_IN_ATTEMPTS,
      },
    },
    advanced: {
      // One query per join, on the relations of tables.ts. Without it the library joins row by row,
      // all at once, on a command's one connection, and pg warns of concurrent queries.
      database: { joins: true },
      // __Host- comes from the names below; the library would otherwise prefix __Secure-.
      useSecureCookies: false,
      cookies: {
        session_token: { name: SESSION_COOKIE },
        session_data: hostCookie('session_data'),
        dont_remember: hostCookie('dont_remember'),
      },
      ipAddress: { ipAddressHeaders: [CLIENT_ADDRESS_HEADER] },
    },
    // The router would print an error it cannot answer, row values and all, to stderr (the
    // `# SERVER_ERROR` line of better-call's dist/router.mjs); thrown, it reaches inLibrary and
    // leaves as a code (S41).
    onAPIError: { throw: true },
    plugins: [INVITATION_ATTEMPTS, organization(ORGANIZATION), admin()],
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
