import { AsyncLocalStorage } from 'node:async_hooks'
import type { GenericEndpointContext } from '@better-auth/core'
import * as libraryContext from '@better-auth/core/context'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import type { FailureCode, PersonId } from '@conexus/hub-api'
import { CAPACITY, COOKIE_PREFIX, PASSWORD_LENGTH, SESSION_COOKIE } from '@conexus/hub-api'
import { betterAuth } from 'better-auth'
import { createAuthEndpoint } from 'better-auth/api'
import { admin, organization } from 'better-auth/plugins'
import { createAccessControl } from 'better-auth/plugins/access'
import type { OrganizationOptions } from 'better-auth/plugins/organization'
import { getOrgAdapter } from 'better-auth/plugins/organization'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { CLIENT_ADDRESS_HEADER } from '../../platform/access.ts'
import type { Config } from '../../platform/config.ts'
import type { CommandTx, Database, Scope } from '../../platform/database.ts'
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
export const PASSWORD_RECOVERY_PATH = '/password-recovery-attempt'
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
// A counting path: the recovery goes through `auth.api`, which skips the router's limit, so
// the route counts its attempts here, as the invitation's do.
const RECOVERY_ATTEMPTS = {
  id: 'password-recovery-attempts',
  endpoints: {
    passwordRecoveryAttempt: createAuthEndpoint(
      PASSWORD_RECOVERY_PATH,
      { method: 'POST' },
      async () => new Response(null, { status: 204 }),
    ),
  },
}
const LIFETIMES = { idleSeconds: 1800, renewAfterSeconds: 60, totalSeconds: 8 * 60 * 60 }
const SIGN_IN_ATTEMPTS = { window: 60, max: 10 }
const RECOVERY_REQUESTS = { window: 60, max: 3 }
// Every password link lives an hour, the first person's and a recovery's (step 6, P2).
export const PASSWORD_LINK_SECONDS = 3600
// The founder's number, step 4 answer 4.
const INVITATION_SECONDS = 2 * 24 * 60 * 60

/** When an invitation renewed now ends, from the plugin's own option, as `getDate` computes it. */
export function invitationExpiry(): Date {
  return new Date(Date.now() + ORGANIZATION.invitationExpiresIn * 1000)
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

/**
 * Each call of the library's adapter goes to the transaction open on this request, as its internal
 * adapter's do: the plugin's resend writes through the plain adapter (`crud-invites.mjs:135-143`),
 * which would leave the scope's transaction for the Hub's login.
 */
function joiningTransaction(adapter: ReturnType<typeof adapterFor>): ReturnType<typeof adapterFor> {
  return (options) => {
    const base = adapter(options)
    const joining = new Proxy(base, {
      get(target, key) {
        const value = Reflect.get(target, key)
        if (typeof value !== 'function') return value
        return async (...args: unknown[]) => {
          // Outside a transaction the library stores this adapter itself as the current one.
          const found = await libraryContext.getCurrentAdapter(target)
          const current = found === joining ? target : found
          return Reflect.apply(Reflect.get(current, key), current, args)
        }
      },
    })
    return joining
  }
}

export type LibraryCommand = <T>(scope: Scope, work: (tx: CommandTx) => Promise<T>) => Promise<T>

/**
 * One command the library joins, in the scope the caller entered: it runs on our transaction as its
 * own, so the plugin's accept, which opens a transaction of its own, writes there too instead of on
 * another connection (D22), and every query of its adapter meets the same row policies.
 */
export function libraryCommandOn(auth: Auth, database: Database): LibraryCommand {
  return (scope, work) =>
    database.libraryCommand(
      relations,
      scope,
      async (tx) =>
        await libraryContext.runWithTransaction(adapterFor(tx)(auth.options), () => work(tx)),
    )
}

/** The first administrator's command, which no person can scope yet. */
export function libraryInstallationOn(auth: Auth, database: Database) {
  return <T>(work: (tx: CommandTx) => Promise<T>) =>
    database.libraryInstallation(
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
// The mark of a company the Central is deleting: only the Hub sets it, never a request.
const DELETING_FIELD = { type: 'date', required: false, input: false } as const
// The company's nickname in its apps' addresses: only the owner's choice through the Hub sets it.
const NICKNAME_FIELD = { type: 'string', required: false, input: false } as const

const accessControl = createAccessControl({
  ...defaultStatements,
  project: ['create', 'delete'],
  company: ['nickname'],
  appVersion: ['create'],
})

const MANAGE_PROJECTS = { project: ['create', 'delete'], appVersion: ['create'] } as const

/**
 * The plugin's roles: its defaults and what each does to a Project (founder, step 7, P1 A). Every
 * member creates one; only an owner or an administrator deletes one, and sends, lists and puts back
 * a version of its app (step 9, P3 A). Only the owner chooses the company's nickname (step 8, N1).
 * `allows` in admission reads these, so who may do what lives here alone (code C26).
 */
export const COMPANY_ROLES = {
  owner: accessControl.newRole({
    ...ownerAc.statements,
    ...MANAGE_PROJECTS,
    company: ['nickname'],
  }),
  admin: accessControl.newRole({ ...adminAc.statements, ...MANAGE_PROJECTS }),
  member: accessControl.newRole({ ...memberAc.statements, project: ['create'] }),
}

const ORGANIZATION = {
  ac: accessControl,
  roles: COMPANY_ROLES,
  schema: {
    organization: {
      modelName: 'company',
      additionalFields: {
        attemptKey: KEY_FIELD,
        deletingSince: DELETING_FIELD,
        nickname: NICKNAME_FIELD,
      },
    },
    invitation: { additionalFields: { attemptKey: KEY_FIELD, mailedAt: MAILED_FIELD } },
  },
  // Only the Operations Central creates a company, through the adapter (step 4.2).
  allowUserToCreateOrganization: false,
  // Only the Operations Central deletes a company, through the adapter (step 5, Q6).
  disableOrganizationDeletion: true,
  // The Hub counts the open invitations itself, under the company's lock: the plugin reads
  // at most 100 rows of them, in no order (docs/reference/boundaries.md).
  invitationLimit: Number.POSITIVE_INFINITY,
  invitationExpiresIn: INVITATION_SECONDS,
  membershipLimit: CAPACITY.members,
} satisfies OrganizationOptions

/**
 * The plugin's own adapter, inside a library command: it writes a company and an invitation as its
 * endpoints do, without their check that the caller is a member. Only the operator, who is never
 * one, writes through it; the Hub's admission decides (docs/reference/boundaries.md).
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
    database: joiningTransaction(adapterFor(deps.database.libraryOrm(relations))),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: PASSWORD_LENGTH.min,
      maxPasswordLength: PASSWORD_LENGTH.max,
      resetPasswordTokenExpiresIn: PASSWORD_LINK_SECONDS,
      revokeSessionsOnPasswordReset: true,
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
        [PASSWORD_RECOVERY_PATH]: RECOVERY_REQUESTS,
      },
    },
    advanced: {
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
    plugins: [INVITATION_ATTEMPTS, RECOVERY_ATTEMPTS, organization(ORGANIZATION), admin()],
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
