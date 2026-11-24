import type {
  AccountOf,
  AccountRef,
  Answered,
  AppKeys,
  ClientCredentialsAuth,
  Connector,
  codeRequest,
  GrantAnswered,
  LoggedOut,
  Native,
  Operation,
  TokenSource,
  WriteOperation,
} from '@conexus/connectors'
import {
  credentialsSource,
  readGrant,
  requestOf,
  revokeRequest,
  toRequest,
} from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { Credential } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { OAuthConnector } from './apps.ts'
import type { ExecutorDeps, Where } from './send.ts'
import { send, sendRead, sendUntil, unreachableAt, whereOf } from './send.ts'
import type { Unreadable } from './wire.ts'
import { isOk, nativeOf } from './wire.ts'
import type { Wrote } from './wrote.ts'
import { wroteOf } from './wrote.ts'

/** A bearer token inside the program: printed, it shows only its name, as a sealed credential. */
export type BearerToken = Secret<'BearerToken'>

export function bearerOf(token: string): BearerToken {
  return new Secret('BearerToken', token)
}

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
export type LoginFailure =
  | Readonly<{ kind: 'AUTH_REFUSED'; native: Native }>
  | Unreadable
  | Unreachable

/** The one place the Hub opens a connector's credential and talks to its provider (decision 0056). */
export type Executor = {
  /**
   * The tokens of a pasted-key connection: the kit's login and logout of the connector, sent with the
   * opened values (S36); each logout is logged by name and never thrown. The kit's session (`limits.ts`) says when.
   */
  pasted(
    connection: OpenedConnection,
  ): TokenSource<LoginFailure, LoggedOut<Unreadable | Unreachable>>
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
   * Sends one write with that token, once and never again (a 429 is not waited out either), given
   * up on after `deadlineMs`. What came back after the request left, and cannot say whether it was
   * taken, is `UNCERTAIN`; only a connection never made is `UNREACHABLE`. Never logs input or output (S41).
   */
  write<I, O>(
    connection: OpenedConnection,
    token: BearerToken,
    operation: WriteOperation<I, O>,
    input: I,
    deadlineMs: number,
  ): Promise<Wrote<O>>
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
  const reading = { secrets: [token.reveal()], whole2xx: false, numbers: connector.numbers }
  const sent = await send(
    deps,
    toRequest(connector, request, token.reveal(), origin),
    where,
    reading,
    deadlineMs,
  )
  if ('kind' in sent)
    return sent.kind === 'UNREACHABLE' ? sent : { kind: 'REFUSED', native: sent.native }
  if (sent.status === 429) return unreachableAt(deps, where, sent.status, sent.body)
  return isOk(sent.status)
    ? { kind: 'REVOKED' }
    : { kind: 'REFUSED', native: nativeOf(sent.status, sent.body) }
}

function logEnded(
  deps: ExecutorDeps,
  where: Where,
  ended: LoggedOut<Unreadable | Unreachable>,
): void {
  if (ended.kind === 'LOGGED_OUT') deps.log.info(where, 'CONNECTOR_LOGGED_OUT')
  else if (ended.kind === 'REFUSED')
    deps.log.info({ ...where, status: ended.answer.status }, 'CONNECTOR_LOGOUT_FAILED')
  else if (ended.kind === 'FAILED') deps.log.info(where, 'CONNECTOR_LOGOUT_FAILED')
}

function pastedSource(deps: ExecutorDeps, connection: OpenedConnection, origin: string) {
  const { connector } = connection
  const { auth } = connector
  if (auth.kind !== 'client_credentials') throw new Error(`No pasted login for ${auth.kind}`)
  const values = valuesOf(connection, auth)
  const where = whereOf(connection)
  const source = credentialsSource<Unreadable | Unreachable>({
    auth,
    credential: values,
    now: () => deps.now().getTime(),
    send(request, a) {
      const secrets = [...Object.values(values), ...(a.token === null ? [] : [a.token])]
      const reading = { secrets, whole2xx: false, numbers: connector.numbers }
      return sendUntil(
        deps,
        toRequest(connector, request, a.token, origin),
        where,
        reading,
        a.signal,
      )
    },
  })
  return {
    ...source,
    async end(grant: Parameters<typeof source.end>[0], signal: AbortSignal) {
      const ended = await source.end(grant, signal)
      logEnded(deps, where, ended)
      return ended
    },
  }
}

function originFor(deps: ExecutorDeps, connector: Connector): string {
  return deps.origins.get(connector.id) ?? connector.origin
}

/** The request built from the input and sent with the connection's secrets redacted; a read repeats on a 429 that fits, a write never. */
function sentFor<I, O>(
  deps: ExecutorDeps,
  a: Readonly<{
    connection: OpenedConnection
    token: BearerToken
    operation: Operation<I, O>
    input: I
  }>,
  deadlineMs: number,
) {
  const { connection, token, operation } = a
  const { connector } = connection
  // The clock is read at each build, so a read's repeat is dated again; a write is built once and never repeated.
  function requestFor() {
    return toRequest(
      connector,
      requestOf(operation, a.input, { ref: connection.accountRef }, deps.now()),
      token.reveal(),
      originFor(deps, connector),
    )
  }
  const { auth } = connector
  const pasted = auth.kind === 'client_credentials' ? valuesOf(connection, auth) : {}
  // A read's 2xx reaches the kit whole: no door returns it, the kit nulls an unreadable one and the check keeps none.
  // A write's answer goes back to the model and the record whole (`Returned`), so its secrets are replaced too.
  const reading = {
    secrets: [...Object.values(pasted), token.reveal()],
    whole2xx: operation.class !== 'write',
    numbers: connector.numbers,
  }
  return sendRead(deps, requestFor, whereOf(connection), reading, {
    deadlineMs,
    repeat: operation.idempotent,
  })
}

export function createExecutor(deps: ExecutorDeps): Executor {
  function originOf(connector: Connector): string {
    return originFor(deps, connector)
  }

  return {
    pasted(connection) {
      return pastedSource(deps, connection, originOf(connection.connector))
    },

    async call(connection, token, operation, input, deadlineMs) {
      const sent = await sentFor(deps, { connection, token, operation, input }, deadlineMs)
      return 'kind' in sent ? sent : operation.answer(sent)
    },

    async write(connection, token, operation, input, deadlineMs) {
      const sent = await sentFor(deps, { connection, token, operation, input }, deadlineMs)
      return wroteOf(sent, operation)
    },

    async grant(where, connector, request, secrets, deadlineMs) {
      const sent = await send(
        deps,
        toRequest(connector, request, null, originOf(connector)),
        where,
        { secrets, whole2xx: true, numbers: connector.numbers },
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
      const reading = { secrets: [token.reveal()], whole2xx: false, numbers: connector.numbers }
      const sent = await send(deps, request, where, reading, deadlineMs)
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
