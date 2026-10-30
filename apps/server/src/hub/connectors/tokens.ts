import { setTimeout } from 'node:timers/promises'
import type { Native } from '@conexus/connectors'
import { refreshRequest } from '@conexus/connectors'
import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import { and, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import { Credential, open, seal } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { OAuthConnector } from './apps.ts'
import { appKeysOf, isOAuth } from './apps.ts'
import type { Login, OpenedConnection } from './executor.ts'
import type { Deps, Viewer } from './rows.ts'
import { ofCompany, scopeOf, sealContext, sealedOf } from './rows.ts'
import { connection } from './tables.ts'

// How long one refresh holds its connection (data D25), past the refresh's own 10 s deadline; a
// second caller rereads every step until it lands, fails or its own deadline ends.
const LEASE_MS = 30_000
const WAIT_STEP_MS = 200
// A token this close to its end is refreshed before a call rather than refused in the middle of one.
const EARLY_MS = 300_000
/**
 * An exchange's or a refresh's own deadline, never what is left of a Testar: once the provider has
 * turned the refresh token, its answer must reach `store` (under the lease's 30 s).
 */
export const GRANT_DEADLINE_MS = 10_000

/** What an OAuth connection's seal holds (S32): `expiresAt` in epoch milliseconds. */
export const ConnectionTokens = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  expiresAt: z.number(),
})
export type ConnectionTokens = z.infer<typeof ConnectionTokens>

/** The tokens of an opened seal; a seal that does not hold them never opened (as the pasted fields). */
export function tokensOf(credential: Credential): ConnectionTokens {
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

type AppRefused = Readonly<{ kind: 'APP_REFUSED'; native: Native }>

/**
 * The bearer for one call. Pasted fields log in every time; OAuth uses the sealed token while it
 * lives, else one refresh leased in the database. `force` refreshes a token the provider refused
 * with 401, whose answer is `refused`: a refresh another caller already found refused ends with it.
 * `deadlineMs` is what is left of the caller's whole work: a login takes one call's deadline of it.
 */
export type Access = {
  token(
    opened: OpenedConnection,
    a: Readonly<{ force: false; deadlineMs: number } | { force: true; deadlineMs: number; refused: Native }>,
  ): Promise<Login | AppRefused>
}

/** The revision and tokens a refresh starts from: the opened row's, then each newer one this Testar saw. */
type Held = { revision: number; tokens: ConnectionTokens }

function bearer(tokens: ConnectionTokens): Login {
  return { kind: 'TOKEN', token: new Secret('BearerToken', tokens.access) }
}

const UNREACHABLE = { kind: 'UNREACHABLE', native: null } as const

/** One Testar's access to its connection (security S34); each step is a short command, no transaction open during a call (D22). */
export function accessFor(deps: Deps, viewer: Viewer): Access {
  const scope = scopeOf(viewer)
  let held: Held | null = null

  function ofRevision(id: ConnectionId, revision: number) {
    return and(ofCompany(viewer, id), eq(connection.revision, revision))
  }

  async function reserve(id: ConnectionId, revision: number): Promise<boolean> {
    const reserved = await deps.database.command(scope, (tx) =>
      tx
        .update(connection)
        .set({ refreshUntil: sql`statement_timestamp() + ${`${LEASE_MS} milliseconds`}::interval` })
        .where(
          and(
            ofRevision(id, revision),
            inArray(connection.state, ['NEW', 'ACTIVE']),
            or(isNull(connection.refreshUntil), lt(connection.refreshUntil, sql`now()`)),
          ),
        )
        .returning({ id: connection.id }),
    )
    return reserved.length === 1
  }

  /** Stores the new tokens on the revision the refresh started from; a row removed or connected again meanwhile keeps nothing. */
  async function store(opened: OpenedConnection, connector: OAuthConnector, next: Held) {
    const sealed = sealTokens(
      deps,
      { id: opened.id, companyId: viewer.companyId, connector },
      next.tokens,
    )
    await deps.database.command(scope, (tx) =>
      tx
        .update(connection)
        .set({
          sealed: Buffer.from(sealed.blob),
          keyId: sealed.keyId,
          revision: next.revision,
          refreshUntil: null,
        })
        .where(ofRevision(opened.id, next.revision - 1)),
    )
  }

  /** A refresh that failed gives the lease back, with NEEDS_REAUTH when the provider refused the grant, so who waits stops now. */
  async function release(id: ConnectionId, revision: number, refused: boolean) {
    const set = refused
      ? { refreshUntil: null, state: 'NEEDS_REAUTH' as const }
      : { refreshUntil: null }
    await deps.database.command(scope, (tx) =>
      tx.update(connection).set(set).where(ofRevision(id, revision)),
    )
  }

  async function reread(opened: OpenedConnection, connector: OAuthConnector) {
    return deps.database.read(scope, async (tx) => {
      const [row] = await tx
        .select({
          revision: connection.revision,
          state: connection.state,
          leased: sql<boolean>`coalesce(${connection.refreshUntil} > now(), false)`,
        })
        .from(connection)
        .where(ofCompany(viewer, opened.id))
      if (row === undefined) throw new Failure('CONNECTION_NOT_FOUND')
      if (row.revision === held?.revision) return { ...row, tokens: held.tokens }
      const context = sealContext({ id: opened.id, companyId: viewer.companyId, connector })
      const credential = open(deps.sealKeys, context, await sealedOf(tx, opened.id))
      return { ...row, tokens: tokensOf(credential) }
    })
  }

  /** The refresh by who holds the lease, with its own deadline: a token the provider already turned must reach `store`. */
  async function refreshed(
    opened: OpenedConnection,
    connector: OAuthConnector,
    from: Held,
  ): Promise<Login | AppRefused> {
    const app = appKeysOf(deps.apps, connector)
    const where = { connectionId: opened.id, connector: connector.id }
    const answered = await deps.executor.grant(
      where,
      connector,
      refreshRequest(connector.auth, app, from.tokens.refresh),
      [app.clientSecret, from.tokens.refresh, from.tokens.access],
      GRANT_DEADLINE_MS,
    )
    switch (answered.kind) {
      case 'OK': {
        const tokens = {
          access: answered.accessToken,
          refresh: answered.refreshToken ?? from.tokens.refresh,
          expiresAt: Date.now() + answered.expiresInSeconds * 1000,
        }
        held = { revision: from.revision + 1, tokens }
        await store(opened, connector, held)
        deps.log.info(where, 'CONNECTION_TOKEN_REFRESHED')
        return bearer(tokens)
      }
      case 'GRANT_REFUSED':
        await release(opened.id, from.revision, true)
        return { kind: 'AUTH_REFUSED', native: answered.native }
      case 'APP_REFUSED':
        await release(opened.id, from.revision, false)
        deps.log.error({ ...where, ...statusOf(answered.native) }, 'CONNECTOR_APP_REFUSED')
        return { kind: 'APP_REFUSED', native: answered.native }
      case 'UNREADABLE':
        await release(opened.id, from.revision, false)
        deps.log.error({ ...where, ...statusOf(answered.native) }, 'CONNECTION_REFRESH_UNREAD')
        return { kind: 'UNREADABLE', native: answered.native }
      case 'UNREACHABLE':
        await release(opened.id, from.revision, false)
        // FailureLog has no warning level: the line is info, as CONNECTOR_UNREACHABLE.
        deps.log.info(where, 'CONNECTION_REFRESH_UNANSWERED')
        return answered
      default:
        return answered satisfies never
    }
  }

  /**
   * Who did not get the lease rereads until the revision changes (the new token), the provider
   * refused the grant, the lease drops with nothing stored, or its own deadline ends.
   */
  async function waited(
    opened: OpenedConnection,
    connector: OAuthConnector,
    from: Held,
    a: Parameters<Access['token']>[1],
  ): Promise<Login> {
    const endsAt = performance.now() + a.deadlineMs
    for (;;) {
      const now = await reread(opened, connector)
      if (now.revision !== from.revision) {
        held = { revision: now.revision, tokens: now.tokens }
        return bearer(now.tokens)
      }
      // Refused before this caller asked: the sealed token is still the provider's to judge, and a forced one already was.
      if (now.state === 'NEEDS_REAUTH')
        return a.force ? { kind: 'AUTH_REFUSED', native: a.refused } : bearer(now.tokens)
      if (!now.leased || performance.now() + WAIT_STEP_MS >= endsAt) return UNREACHABLE
      await setTimeout(WAIT_STEP_MS)
    }
  }

  return {
    async token(opened, a) {
      const { connector } = opened
      if (!isOAuth(connector))
        return deps.executor.login(opened, Math.min(deps.callDeadlineMs, a.deadlineMs))
      const from = held ?? { revision: opened.revision, tokens: tokensOf(opened.credential) }
      held = from
      if (!a.force && from.tokens.expiresAt - EARLY_MS > Date.now()) return bearer(from.tokens)
      // Before the lease: an installation without the app keys calls nothing.
      appKeysOf(deps.apps, connector)
      if (await reserve(opened.id, from.revision)) return refreshed(opened, connector, from)
      return waited(opened, connector, from, a)
    },
  }
}

function statusOf(native: Native) {
  return { status: native.status, code: native.code ?? '-' }
}
