import { setTimeout as sleep } from 'node:timers/promises'
import type {
  AccountOf,
  AccountRef,
  Answered,
  ClientCredentialsAuth,
  Connector,
  ConnectorId,
  codeRequest,
  GrantAnswered,
  Native,
  Operation,
  ProviderAnswer,
  Unread,
} from '@conexus/connectors'
import {
  locateOf,
  readGrant,
  readToken,
  requestOf,
  tokenRequest,
  toRequest,
} from '@conexus/connectors'
import type { ConnectionId, ConnectionSignInId } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { retryAfterMs } from '../../platform/retry-after.ts'
import type { Credential } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { OAuthConnector } from './apps.ts'

/**
 * A provider's answer is read up to this many bytes and no further. Measured on a real Sankhya
 * (2026-10-30), a page of 50 reached 354 KB (clientes), 500 KB (notas fiscais) and 931 KB
 * (devoluções); the OS's 256 KB came from its SQL gateway and cut REST pages.
 */
const RESPONSE_CAP_BYTES = 2 * 1024 * 1024

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

/** What a log line about one exchange with the provider names: the connection, or the authorization before it exists. */
type Where = Readonly<
  { connector: ConnectorId } & ({ connectionId: ConnectionId } | { signInId: ConnectionSignInId })
>

/** The exchange or the renewal, as the kit builds it. */
type TokenRequest = ReturnType<typeof codeRequest>

/** The provider could not be reached (or answered 5xx): `native` is what it said, when it said anything. */
type Unreachable = Readonly<{ kind: 'UNREACHABLE'; native: Native | null }>
/** The provider answered what the kit cannot read, with what it said. */
type Unreadable = Readonly<{ kind: 'UNREADABLE'; native: Native }>
export type Login =
  | Readonly<{ kind: 'TOKEN'; token: BearerToken }>
  | Readonly<{ kind: 'AUTH_REFUSED'; native: Native }>
  | Unreadable
  | Unreachable

/** The one place the Hub opens a connector's credential and talks to its provider (decision 0056). */
export type Executor = {
  /** A new token for an opened connection: the login, sent once (no cache in step 19), given up on after `deadlineMs`. */
  login(connection: OpenedConnection, deadlineMs: number): Promise<Login>
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

/** The body, read in pieces up to the cap; past it the read is cancelled, nothing is kept and the result is null. */
async function bodyOf(response: Response): Promise<Uint8Array | null> {
  const chunks: Uint8Array[] = []
  let bytes = 0
  const reader = response.body?.getReader()
  if (reader === undefined) return new Uint8Array()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return Buffer.concat(chunks)
    bytes += value.byteLength
    if (bytes > RESPONSE_CAP_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
}

const REDACTED = '[redacted]'

/** The request's secrets, replaced in what comes back; `whole2xx`: a 2xx reaches the kit unchanged. */
type Redaction = Readonly<{ secrets: readonly string[]; whole2xx: boolean }>

/** The text with every secret of the request replaced, as it is and as JSON writes it (Nango's `buildValuesToFilter`). */
function redacted(text: string, secrets: readonly string[]): string {
  return secrets
    .filter((secret) => secret !== '')
    .flatMap((secret) => [secret, JSON.stringify(secret).slice(1, -1)])
    .reduce((safe, secret) => safe.replaceAll(secret, REDACTED), text)
}

function isOk(status: number): boolean {
  return status >= 200 && status < 300
}

/**
 * The body read only at the end, with the request's secrets replaced first, whatever the status
 * (a gateway refuses at HTTP 200 and carries its body in `native`), except a 2xx sent `whole`. Text
 * that is not JSON is the body itself outside 2xx, so the kit still decides by status; a 2xx that
 * is not JSON is null, never an empty answer.
 */
function answerOf(
  status: number,
  bytes: Uint8Array,
  redaction: Redaction,
  waitMs?: number,
): ProviderAnswer | null {
  const wait = waitMs === undefined ? {} : { retryAfterMs: waitMs }
  if (bytes.byteLength === 0) return { status, body: undefined, ...wait }
  const text = Buffer.from(bytes).toString('utf8')
  const safe = redaction.whole2xx && isOk(status) ? text : redacted(text, redaction.secrets)
  try {
    return { status, body: z.unknown().parse(JSON.parse(safe)), ...wait }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return isOk(status) ? null : { status, body: safe, ...wait }
  }
}

function nativeOf(status: number, body: unknown): Native {
  return { status, ...locateOf(body), body }
}

/** An answer the kit never sees: past the cap (`bytes` null), or a 2xx in text that is not JSON; the screen says which. */
function unreadable(status: number, bytes: Uint8Array | null): Unreadable {
  const reason: Unread =
    bytes === null
      ? { kind: 'TOO_LARGE', limitBytes: RESPONSE_CAP_BYTES }
      : { kind: 'SHAPE', issues: [{ path: '', expected: 'json', received: 'text' }] }
  return { kind: 'UNREADABLE', native: { ...nativeOf(status, null), reason } }
}

/**
 * What fetch documents for a provider that cannot be reached: a network failure or a refused
 * redirect (TypeError), the deadline (TimeoutError) or an abort. Anything else is a bug and goes up.
 * The scalars a log may carry: the error's name and the system code of its cause (ECONNREFUSED...).
 */
function unreachableCause(error: unknown): Record<string, string> | undefined {
  const known =
    error instanceof TypeError ||
    (error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name))
  if (!known) return undefined
  const code = z.object({ code: z.string() }).safeParse(error.cause)
  return code.success ? { kind: error.name, cause: code.data.code } : { kind: error.name }
}

type ExecutorDeps = {
  fetch: typeof fetch
  origins: ReadonlyMap<ConnectorId, string>
  log: FailureLog
}

/**
 * Sends one request (the OS's `send`): a redirect refused by fetch, every body read up to the cap
 * and parsed only at the end, every body redacted of `secrets` first. A 5xx is UNREACHABLE and
 * keeps what it said. What is logged is scalars: the connection, the status or the error's name
 * and cause code; never a body.
 */
async function send(
  deps: ExecutorDeps,
  request: Request,
  where: Where,
  redaction: Redaction,
  deadlineMs: number,
): Promise<ProviderAnswer | Unreadable | Unreachable> {
  // Outside the `try`: a deadline the timer refuses is the caller's mistake, not the provider down.
  const signal = AbortSignal.timeout(deadlineMs)
  try {
    const response = await deps.fetch(request, { signal })
    const { status } = response
    const bytes = await bodyOf(response)
    const wait =
      status === 429 ? retryAfterMs(Object.fromEntries(response.headers), Date.now()) : undefined
    const answer = bytes === null ? null : answerOf(status, bytes, redaction, wait)
    if (status >= 500) return unreachableAt(deps, where, status, answer?.body ?? null)
    return answer ?? unreadable(status, bytes)
  } catch (error) {
    const cause = unreachableCause(error)
    if (cause === undefined) throw error
    deps.log.info({ ...where, ...cause }, 'CONNECTOR_UNREACHABLE')
    return { kind: 'UNREACHABLE', native: null }
  }
}

/**
 * `send`, and when the provider answered 429 with a wait that fits what is left of the deadline, the
 * wait and one repeat. Only a read repeats (`repeat`): a write's body was spent by the first send.
 */
async function sendRead(
  deps: ExecutorDeps,
  request: Request,
  where: Where,
  redaction: Redaction,
  a: Readonly<{ deadlineMs: number; repeat: boolean }>,
): Promise<ProviderAnswer | Unreadable | Unreachable> {
  const started = performance.now()
  const sent = await send(deps, request, where, redaction, a.deadlineMs)
  if (!a.repeat || 'kind' in sent || sent.status !== 429 || sent.retryAfterMs === undefined)
    return sent
  if (sent.retryAfterMs >= a.deadlineMs - (performance.now() - started) - 1) return sent
  await sleep(sent.retryAfterMs)
  const remaining = Math.floor(a.deadlineMs - (performance.now() - started))
  return send(deps, request, where, redaction, remaining)
}

function unreachableAt(
  deps: ExecutorDeps,
  where: Where,
  status: number,
  body: unknown,
): Unreachable {
  deps.log.info({ ...where, status }, 'CONNECTOR_UNREACHABLE')
  return { kind: 'UNREACHABLE', native: nativeOf(status, body) }
}

/** Whose connection a call is about, for the log. */
function whereOf(connection: OpenedConnection): Where {
  return { connectionId: connection.id, connector: connection.connector.id }
}

export function createExecutor(deps: ExecutorDeps): Executor {
  function originOf(connector: Connector): string {
    return deps.origins.get(connector.id) ?? connector.origin
  }

  return {
    async login(connection, deadlineMs) {
      const { connector } = connection
      const auth = connector.auth
      if (auth.kind !== 'client_credentials') throw new Error(`No pasted login for ${auth.kind}`)
      const values = valuesOf(connection, auth)
      const request = toRequest(connector, tokenRequest(auth, values), null, originOf(connector))
      const redaction = { secrets: Object.values(values), whole2xx: false }
      const sent = await send(deps, request, whereOf(connection), redaction, deadlineMs)
      if ('kind' in sent) return sent
      const token = readToken(auth, sent)
      if (token.kind !== 'OK') return token
      return { kind: 'TOKEN', token: new Secret('BearerToken', token.accessToken) }
    },

    async call(connection, token, operation, input, deadlineMs) {
      const { connector } = connection
      const request = toRequest(
        connector,
        requestOf(operation, input, { ref: connection.accountRef }),
        token.reveal(),
        originOf(connector),
      )
      const { auth } = connector
      const pasted = auth.kind === 'client_credentials' ? valuesOf(connection, auth) : {}
      const redaction = { secrets: [...Object.values(pasted), token.reveal()], whole2xx: false }
      const sent = await sendRead(deps, request, whereOf(connection), redaction, {
        deadlineMs,
        repeat: operation.idempotent,
      })
      return 'kind' in sent ? sent : operation.answer(sent)
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
