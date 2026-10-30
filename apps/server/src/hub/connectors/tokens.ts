import { setTimeout } from 'node:timers/promises'
import type { Native } from '@conexus/connectors'
import { refreshRequest } from '@conexus/connectors'
import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { GRANT_DEADLINE_MS } from '@conexus/hub-api'
import { and, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { OAuthConnector } from './apps.ts'
import { appKeysOf, isOAuth } from './apps.ts'
import type { BearerToken, Login, OpenedConnection } from './executor.ts'
import type { Deps, Viewer } from './rows.ts'
import { ofCompany, scopeOf, sealContext, sealedOf } from './rows.ts'
import { connection } from './tables.ts'

// How long one refresh holds its connection (data D25), past the refresh's own 10 s deadline; a
// second caller rereads every step until it lands, fails or its own deadline ends.
const LEASE_MS = 30_000
const WAIT_STEP_MS = 200
// A token this close to its end is refreshed before a call rather than refused in the middle of one.
const EARLY_MS = 300_000
/** What an OAuth connection's seal holds (S32): `expiresAt` in epoch milliseconds. */
export const ConnectionTokens = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  expiresAt: z.number(),
})
export type ConnectionTokens = z.infer<typeof ConnectionTokens>

/** The tokens of an opened seal; a seal that does not hold them never opened (as the pasted fields). */
function tokensOf(credential: Credential): ConnectionTokens {
  try {
    return ConnectionTokens.parse(JSON.parse(credential.reveal()))
  } catch (cause) {
    if (!(cause instanceof SyntaxError || cause instanceof z.ZodError)) throw cause
    throw new Failure('SEAL_REFUSED', { details: { reason: 'tokens shape' }, cause })
  }
}

/** The tokens sealed to the connection's row, company and connector. */
export function sealTokens(
  deps: Pick<Deps, 'sealKeys'>,
  row: { id: ConnectionId; companyId: CompanyId; connector: OAuthConnector },
  tokens: ConnectionTokens,
) {
  return seal(deps.sealKeys, sealContext(row), Credential.parse(JSON.stringify(tokens)))
}

export type AppRefused = Readonly<{ kind: 'APP_REFUSED'; native: Native }>

/**
 * The bearer for one call. Pasted fields use the token `limits.ts` owns, one login at a time; OAuth uses the sealed token while it
 * lives, else one refresh leased in the database. `force` refreshes a token the provider refused
 * with 401, whose answer is `refused`: a refresh another caller already found refused ends with it.
 * A login, and a wait for another caller's refresh, each take one call's deadline.
 */
export type Access = {
  token(
    opened: OpenedConnection,
    a: Readonly<
      { force: false; deadlineMs?: number } | { force: true; refused: Native; deadlineMs?: number }
    >,
  ): Promise<Login | AppRefused>
}

/** The revision and tokens a refresh starts from: the opened row's, then each newer one this Testar saw. */
type Held = { revision: number; tokens: ConnectionTokens }

function bearer(tokens: ConnectionTokens): Login {
  return { kind: 'TOKEN', token: new Secret('BearerToken', tokens.access) }
}

const UNREACHABLE = { kind: 'UNREACHABLE', native: null } as const

/** One refresh's ground: the Testar's company and person, the connection, and the revision and tokens it starts from. */
type Ground = Readonly<{
  deps: Deps
  viewer: Viewer
  opened: OpenedConnection
  connector: OAuthConnector
  from: Held
}>

function ofRevision(g: Ground, revision: number) {
  return and(ofCompany(g.viewer, g.opened.id), eq(connection.revision, revision))
}

async function reserve(g: Ground): Promise<boolean> {
  const reserved = await g.deps.database.command(scopeOf(g.viewer), (tx) =>
    tx
      .update(connection)
      .set({ refreshUntil: sql`statement_timestamp() + ${`${LEASE_MS} milliseconds`}::interval` })
      .where(
        and(
          ofRevision(g, g.from.revision),
          inArray(connection.state, ['NEW', 'ACTIVE']),
          or(isNull(connection.refreshUntil), lt(connection.refreshUntil, sql`now()`)),
        ),
      )
      .returning({ id: connection.id }),
  )
  return reserved.length === 1
}

/** Stores the new tokens on the revision the refresh started from; a row removed or connected again meanwhile keeps nothing. */
async function store(g: Ground, tokens: ConnectionTokens) {
  const row = { id: g.opened.id, companyId: g.viewer.companyId, connector: g.connector }
  const sealed = sealTokens(g.deps, row, tokens)
  await g.deps.database.command(scopeOf(g.viewer), (tx) =>
    tx
      .update(connection)
      .set({
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        revision: g.from.revision + 1,
        refreshUntil: null,
      })
      .where(ofRevision(g, g.from.revision)),
  )
}

/** A refresh that failed gives the lease back, with NEEDS_REAUTH when the provider refused the grant, so who waits stops now. */
async function release(g: Ground, refused: boolean) {
  const set = refused
    ? { refreshUntil: null, state: 'NEEDS_REAUTH' as const }
    : { refreshUntil: null }
  await g.deps.database.command(scopeOf(g.viewer), (tx) =>
    tx.update(connection).set(set).where(ofRevision(g, g.from.revision)),
  )
}

/** The row as it is now; its seal opened only when its revision is not the one already held. */
function reread(g: Ground) {
  return g.deps.database.read(scopeOf(g.viewer), async (tx) => {
    const [row] = await tx
      .select({
        revision: connection.revision,
        state: connection.state,
        leased: sql<boolean>`coalesce(${connection.refreshUntil} > now(), false)`,
      })
      .from(connection)
      .where(ofCompany(g.viewer, g.opened.id))
    if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
    if (row.revision === g.from.revision) return { ...row, tokens: g.from.tokens }
    const context = sealContext({
      id: g.opened.id,
      companyId: g.viewer.companyId,
      connector: g.connector,
    })
    const credential = open(g.deps.sealKeys, context, await sealedOf(tx, g.opened.id))
    return { ...row, tokens: tokensOf(credential) }
  })
}

type Turned = Readonly<{ answer: Login | AppRefused; held: Held | null }>

/** The refresh by who holds the lease, with its own deadline: a token the provider already turned must reach `store`. */
async function refreshed(g: Ground): Promise<Turned> {
  const { deps, connector, from } = g
  const app = appKeysOf(deps.apps, connector)
  const where = { connectionId: g.opened.id, connector: connector.id }
  const answered = await deps.executor.grant(
    where,
    connector,
    refreshRequest(connector.auth, app, from.tokens.refresh),
    [app.clientSecret, from.tokens.refresh, from.tokens.access],
    GRANT_DEADLINE_MS,
  )
  if (answered.kind === 'OK') {
    const tokens = {
      access: answered.accessToken,
      refresh: answered.refreshToken ?? from.tokens.refresh,
      expiresAt: Date.now() + answered.expiresInSeconds * 1000,
    }
    await store(g, tokens)
    deps.log.info(where, 'CONNECTION_TOKEN_REFRESHED')
    return { answer: bearer(tokens), held: { revision: from.revision + 1, tokens } }
  }
  await release(g, answered.kind === 'GRANT_REFUSED')
  switch (answered.kind) {
    case 'GRANT_REFUSED':
      return { answer: { kind: 'AUTH_REFUSED', native: answered.native }, held: null }
    case 'APP_REFUSED':
      deps.log.error({ ...where, ...statusOf(answered.native) }, 'CONNECTOR_APP_REFUSED')
      return { answer: { kind: 'APP_REFUSED', native: answered.native }, held: null }
    case 'UNREADABLE':
      deps.log.error({ ...where, ...statusOf(answered.native) }, 'CONNECTION_REFRESH_UNREAD')
      return { answer: { kind: 'UNREADABLE', native: answered.native }, held: null }
    case 'UNREACHABLE':
      // FailureLog has no warning level: the line is info, as CONNECTOR_UNREACHABLE.
      deps.log.info(where, 'CONNECTION_REFRESH_UNANSWERED')
      return { answer: answered, held: null }
    default:
      return answered satisfies never
  }
}

/**
 * Who did not get the lease rereads until the revision changes (the new token), the provider
 * refused the grant, the lease drops with nothing stored, or its own deadline ends.
 */
async function waited(g: Ground, a: Parameters<Access['token']>[1]): Promise<Turned> {
  const endsAt = performance.now() + g.deps.callDeadlineMs
  for (;;) {
    const now = await reread(g)
    if (now.revision !== g.from.revision)
      return { answer: bearer(now.tokens), held: { revision: now.revision, tokens: now.tokens } }
    // Refused before this caller asked: the sealed token is still the provider's to judge, and a forced one already was.
    if (now.state === 'NEEDS_REAUTH') {
      const answer = a.force
        ? { kind: 'AUTH_REFUSED' as const, native: a.refused }
        : bearer(now.tokens)
      return { answer, held: null }
    }
    if (!now.leased || performance.now() + WAIT_STEP_MS >= endsAt)
      return { answer: UNREACHABLE, held: null }
    await setTimeout(WAIT_STEP_MS)
  }
}

/** The pasted key's token from `limits`; a forced one is a token the provider ended, dropped so the next is a new login. */
function pastedToken(
  deps: Deps,
  opened: OpenedConnection,
  a: Parameters<Access['token']>[1],
  remembered: BearerToken | null,
) {
  if (a.force && remembered !== null) deps.limits.invalidate(opened, remembered)
  return deps.limits.token(opened, a.deadlineMs ?? deps.callDeadlineMs)
}

/** One Testar's access to its connection (security S34); each step is a short command, no transaction open during a call (D22). */
export function accessFor(deps: Deps, viewer: Viewer): Access {
  let held: Held | null = null
  let pasted: BearerToken | null = null
  return {
    async token(opened, a) {
      const { connector } = opened
      if (!isOAuth(connector)) {
        const login = await pastedToken(deps, opened, a, pasted)
        pasted = login.kind === 'TOKEN' ? login.token : null
        return login
      }
      const from = held ?? { revision: opened.revision, tokens: tokensOf(opened.credential) }
      held = from
      if (!a.force && from.tokens.expiresAt - EARLY_MS > Date.now()) return bearer(from.tokens)
      // Before the lease: an installation without the app keys calls nothing.
      appKeysOf(deps.apps, connector)
      const ground = { deps, viewer, opened, connector, from }
      const turned = (await reserve(ground)) ? await refreshed(ground) : await waited(ground, a)
      held = turned.held ?? held
      return turned.answer
    },
  }
}

/** What the provider said, as a log may carry it: its status and code, never its body (S41). */
export function statusOf(native: Native) {
  return { status: native.status, code: native.code ?? '-' }
}
