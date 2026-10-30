import type {
  AccountOf,
  AccountRef,
  Answered,
  AppKeys,
  ClientCredentialsAuth,
  Connector,
  codeRequest,
  GrantAnswered,
  Native,
  Operation,
} from '@conexus/connectors'
import {
  logoutRequest,
  readGrant,
  readToken,
  requestOf,
  revokeRequest,
  tokenRequest,
  toRequest,
} from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Credential } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { OAuthConnector } from './apps.ts'
import type { ExecutorDeps, Where } from './send.ts'
import { send, sendRead, unreachableAt, whereOf } from './send.ts'
import type { Unreadable } from './wire.ts'
import { isOk, nativeOf } from './wire.ts'

/** A bearer token inside the program: printed, it shows only its name, as a sealed credential. */
export type BearerToken = Secret<'BearerToken'>

/**
 * A connection whose sealed credential was opened for this call; the values live only here (S36).
 * `revision` is the row's as it was opened: a refresh stores only on it (C38).
 */
export type OpenedConnection = Readonly<{
  id: ConnectionId
  linkedAt: string
  connector: Connector
  credential: Credential
  revision: number
  accountRef: AccountRef | null
}>

import type { Unreachable } from './send.ts'

/** The exchange or the renewal, as the kit builds it. */
type TokenRequest = ReturnType<typeof codeRequest>

/** What the provider answered to taking the grant back: done, or it refused (`native`), or it could not be reached. */
type Revoked =
  | Readonly<{ kind: 'REVOKED' }>
  | Readonly<{ kind: 'REFUSED'; native: Native }>
  | Unreachable
/** What the provider answered to ending a token's session: done, refused, or not reached. */
type LoggedOut = 'LOGGED_OUT' | 'REFUSED' | 'UNREACHABLE'
export type Login =
  | Readonly<{ kind: 'TOKEN'; token: BearerToken }>
  | Readonly<{ kind: 'AUTH_REFUSED'; native: Native }>
  | Unreadable
  | Unreachable
/** A pasted-key login: the token and how long the provider says it lives. */
type PastedLogin =
  | Readonly<{ kind: 'TOKEN'; token: BearerToken; expiresInSeconds: number }>
  | Exclude<Login, { kind: 'TOKEN' }>

/** The one place the Hub opens a connector's credential and talks to its provider (decision 0056). */
export type Executor = {
  /** A new token for an opened connection: the login, sent once (`limits.ts` owns when), given up on after `deadlineMs`. */
  login(connection: OpenedConnection, deadlineMs: number): Promise<PastedLogin>
  /**
   * Calls one operation with that token, given up on after `deadlineMs`; never logs input, output
   * or credential (S41). Transport, deadline, redirect and 5xx are UNREACHABLE; the kit's Answered
   * otherwise. An idempotent read that gets a 429 naming its wait waits once, when the wait fits the
   * deadline, and is repeated; a second 429, or a wait that does not fit, is the kit's BUSY.
   */
  call<I, O>(
    connection: OpenedConnection,
    token: BearerToken,
    operation: Operation<I, O>,
    input: I,
    deadlineMs: number,
  ): Promise<Answered<O> | Unreachable>
  /**
   * Ends the session of a pasted-key connection's token at the provider, as the connector declares
   * it, while the token lives (an expired token's logout is refused). Nothing is sent, and null
   * comes back, when the connector declares none; a refusal or a connector that cannot be reached
   * is logged by name and never thrown.
   */
  logout(
    connection: Pick<OpenedConnection, 'id' | 'connector'>,
    token: BearerToken,
    deadlineMs: number,
  ): Promise<LoggedOut | null>
  /**
   * Sends an OAuth exchange or renewal and reads it by the kit. A 429 is UNREACHABLE, as a 5xx. A
   * refusal's body comes back with `secrets` replaced; a 2xx reaches the kit whole, since it may
   * carry the same refresh token back.
   */
  grant(
    where: Where,
    connector: OAuthConnector,
    request: TokenRequest,
    secrets: readonly string[],
    deadlineMs: number,
  ): Promise<GrantAnswered | Unreachable>
  /**
   * Takes the grant back at the provider with the connection's live token, as the connector
   * declares it; a 429 is UNREACHABLE. Nothing is sent, and null comes back, when the connector
   * declares no revoke.
   */
  revoke(
    connection: OpenedConnection,
    connector: OAuthConnector,
    token: BearerToken,
    app: AppKeys,
    deadlineMs: number,
  ): Promise<Revoked | null>
  /** Whose account a token is (`who.path`), read by the connector's `who.answer`. */
  who(
    where: Where,
    connector: OAuthConnector,
    token: BearerToken,
    deadlineMs: number,
  ): Promise<Readonly<{ kind: 'OK'; account: AccountOf }> | Unreadable | Unreachable>
}

/** The opened values, checked again by the connector's own schema: a value it refuses never opened. */
function valuesOf(
  connection: OpenedConnection,
  auth: ClientCredentialsAuth,
): Readonly<Record<string, string>> {
  try {
    return auth.credential.parse(JSON.parse(connection.credential.reveal()))
  } catch (cause) {
    if (!(cause instanceof SyntaxError || cause instanceof z.ZodError)) throw cause
    throw new Failure('SEAL_REFUSED', { details: { reason: 'credential shape' }, cause })
  }
}

/** The connector's declared revoke, sent with the connection's token; null when it declares none or the connection has no account yet. */
async function revoked(
  deps: ExecutorDeps,
  a: Readonly<{
    connection: OpenedConnection
    connector: OAuthConnector
    token: BearerToken
    app: AppKeys
  }>,
  origin: string,
  deadlineMs: number,
): Promise<Revoked | null> {
  const { connection, connector, token } = a
  if (connection.accountRef === null) return null
  const request = revokeRequest(connector.auth, {
    accountRef: connection.accountRef,
    clientId: a.app.clientId,
  })
  if (request === null) return null
  const where = whereOf(connection)
  const redaction = { secrets: [token.reveal()], whole2xx: false }
  const sent = await send(
    deps,
    toRequest(connector, request, token.reveal(), origin),
    where,
    redaction,
    deadlineMs,
  )
  if ('kind' in sent)
    return sent.kind === 'UNREACHABLE' ? sent : { kind: 'REFUSED', native: sent.native }
  if (sent.status === 429) return unreachableAt(deps, where, sent.status, sent.body)
  return isOk(sent.status)
    ? { kind: 'REVOKED' }
    : { kind: 'REFUSED', native: nativeOf(sent.status, sent.body) }
}

/** The pasted-key login, sent once to the connector's token path with the opened values. */
async function loggedIn(
  deps: ExecutorDeps,
  a: Readonly<{ connection: OpenedConnection; origin: string }>,
  deadlineMs: number,
): Promise<PastedLogin> {
  const { connection } = a
  const { connector } = connection
  const auth = connector.auth
  if (auth.kind !== 'client_credentials') throw new Error(`No pasted login for ${auth.kind}`)
  const values = valuesOf(connection, auth)
  const request = toRequest(connector, tokenRequest(auth, values), null, a.origin)
  const redaction = { secrets: Object.values(values), whole2xx: false }
  const sent = await send(deps, request, whereOf(connection), redaction, deadlineMs)
  if ('kind' in sent) return sent
  const token = readToken(auth, sent)
  if (token.kind !== 'OK') return token
  return {
    kind: 'TOKEN',
    token: new Secret('BearerToken', token.accessToken),
    expiresInSeconds: token.expiresInSeconds,
  }
}

/** The connector's declared logout, sent with the token while it lives; null when it declares none. */
async function loggedOut(
  deps: ExecutorDeps,
  a: Readonly<{
    connection: Pick<OpenedConnection, 'id' | 'connector'>
    token: BearerToken
    origin: string
  }>,
  deadlineMs: number,
): Promise<LoggedOut | null> {
  const { connection, token } = a
  const { auth } = connection.connector
  const request = auth.kind === 'client_credentials' ? logoutRequest(auth) : null
  if (request === null) return null
  const where = whereOf(connection)
  const redaction = { secrets: [token.reveal()], whole2xx: false }
  const sent = await send(
    deps,
    toRequest(connection.connector, request, token.reveal(), a.origin),
    where,
    redaction,
    deadlineMs,
  )
  if ('kind' in sent) {
    deps.log.info(where, 'CONNECTOR_LOGOUT_FAILED')
    return sent.kind === 'UNREACHABLE' ? 'UNREACHABLE' : 'REFUSED'
  }
  if (!isOk(sent.status)) {
    deps.log.info({ ...where, status: sent.status }, 'CONNECTOR_LOGOUT_FAILED')
    return 'REFUSED'
  }
  deps.log.info(where, 'CONNECTOR_LOGGED_OUT')
  return 'LOGGED_OUT'
}

export function createExecutor(deps: ExecutorDeps): Executor {
  function originOf(connector: Connector): string {
    return deps.origins.get(connector.id) ?? connector.origin
  }

  return {
    login(connection, deadlineMs) {
      return loggedIn(deps, { connection, origin: originOf(connection.connector) }, deadlineMs)
    },

    async call(connection, token, operation, input, deadlineMs) {
      const { connector } = connection
      function requestFor() {
        return toRequest(
          connector,
          requestOf(operation, input, { ref: connection.accountRef }),
          token.reveal(),
          originOf(connector),
        )
      }
      const { auth } = connector
      const pasted = auth.kind === 'client_credentials' ? valuesOf(connection, auth) : {}
      // No door returns an operation's 2xx body: the kit nulls an unreadable one, and the check keeps none.
      const redaction = { secrets: [...Object.values(pasted), token.reveal()], whole2xx: true }
      const sent = await sendRead(deps, requestFor, whereOf(connection), redaction, {
        deadlineMs,
        repeat: operation.idempotent,
      })
      return 'kind' in sent ? sent : operation.answer(sent)
    },

    logout(connection, token, deadlineMs) {
      return loggedOut(
        deps,
        { connection, token, origin: originOf(connection.connector) },
        deadlineMs,
      )
    },

    async grant(where, connector, request, secrets, deadlineMs) {
      const sent = await send(
        deps,
        toRequest(connector, request, null, originOf(connector)),
        where,
        { secrets, whole2xx: true },
        deadlineMs,
      )
      if ('kind' in sent) return sent
      if (sent.status === 429) return unreachableAt(deps, where, sent.status, sent.body)
      return readGrant(connector.auth, sent)
    },

    revoke(connection, connector, token, app, deadlineMs) {
      return revoked(deps, { connection, connector, token, app }, originOf(connector), deadlineMs)
    },

    async who(where, connector, token, deadlineMs) {
      const { who } = connector.account.kind === 'reported' ? connector.account : { who: null }
      if (who === null) throw new Error(`No reported account for ${connector.id}`)
      const request = toRequest(
        connector,
        { method: 'GET', path: who.path, query: {}, body: undefined },
        token.reveal(),
        originOf(connector),
      )
      const redaction = { secrets: [token.reveal()], whole2xx: false }
      const sent = await send(deps, request, where, redaction, deadlineMs)
      if ('kind' in sent) return sent
      if (sent.status === 429) return unreachableAt(deps, where, sent.status, sent.body)
      if (!isOk(sent.status))
        return { kind: 'UNREADABLE', native: nativeOf(sent.status, sent.body) }
      const account = who.answer.safeParse(sent.body)
      // A 2xx outside the schema keeps none of its body: it is the person's own profile.
      if (!account.success) return { kind: 'UNREADABLE', native: nativeOf(sent.status, null) }
      return { kind: 'OK', account: account.data }
    },
  }
}
