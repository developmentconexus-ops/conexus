import type {
  Answered,
  Connector,
  ConnectorId,
  Native,
  Operation,
  ProviderAnswer,
} from '@conexus/connectors'
import { locateOf, readToken, requestOf, tokenRequest, toRequest } from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Credential } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'

/** A provider's answer is read up to this many bytes and no further (the OS's gateway cap). */
const RESPONSE_CAP_BYTES = 256 * 1024

/** A bearer token inside the program: printed, it shows only its name, as a sealed credential. */
export type BearerToken = Secret<'BearerToken'>

/** A connection whose sealed credential was opened for this call; the values live only here (S36). */
export type OpenedConnection = Readonly<{
  id: ConnectionId
  linkedAt: string
  connector: Connector
  credential: Credential
}>

/** The provider could not be reached (or answered 5xx): `native` is what it said, when it said anything. */
type Unreachable = Readonly<{ kind: 'UNREACHABLE'; native: Native | null }>
/** The provider answered what the kit cannot read, with what it said. */
type Unreadable = Readonly<{ kind: 'UNREADABLE'; native: Native }>
type Login =
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
   * otherwise.
   */
  call<I, O>(
    connection: OpenedConnection,
    token: BearerToken,
    operation: Operation<I, O>,
    input: I,
    deadlineMs: number,
  ): Promise<Answered<O> | Unreachable>
}

/** The opened values, checked again by the connector's own schema: a value it refuses never opened. */
function valuesOf(connection: OpenedConnection): Readonly<Record<string, string>> {
  const { auth } = connection.connector
  // Linking refuses a connector that is not a pasted-fields login, so no connection of another kind exists until 19.1 U2.
  if (auth.kind !== 'client_credentials') throw new Error(`No pasted credential for ${auth.kind}`)
  const { credential } = auth
  try {
    return credential.parse(JSON.parse(connection.credential.reveal()))
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

/** The text with every secret of the request replaced, as it is and as JSON writes it (Nango's `buildValuesToFilter`). */
function redacted(text: string, secrets: readonly string[]): string {
  return secrets
    .filter((secret) => secret !== '')
    .flatMap((secret) => [secret, JSON.stringify(secret).slice(1, -1)])
    .reduce((safe, secret) => safe.replaceAll(secret, REDACTED), text)
}

/**
 * The body read only at the end, with the request's secrets replaced first, whatever the status
 * (a gateway refuses at HTTP 200 and carries its body in `native`). Text that is not JSON is the
 * body itself outside 2xx, so the kit still decides by status; a 2xx that is not JSON is null,
 * never an empty answer.
 */
function answerOf(
  status: number,
  bytes: Uint8Array,
  secrets: readonly string[],
): ProviderAnswer | null {
  if (bytes.byteLength === 0) return { status, body: undefined }
  const safe = redacted(Buffer.from(bytes).toString('utf8'), secrets)
  try {
    return { status, body: z.unknown().parse(JSON.parse(safe)) }
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return status >= 200 && status < 300 ? null : { status, body: safe }
  }
}

function nativeOf(status: number, body: unknown): Native {
  return { status, ...locateOf(body), body }
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

export function createExecutor(deps: {
  fetch: typeof fetch
  origins: ReadonlyMap<ConnectorId, string>
  log: FailureLog
}): Executor {
  function originOf(connector: Connector): string {
    return deps.origins.get(connector.id) ?? connector.origin
  }

  /**
   * Sends one request (the OS's `send`): a redirect refused by fetch, every body read up to the
   * cap and parsed only at the end, every body redacted of `secrets` first. A 5xx is
   * UNREACHABLE and keeps what it said. What is logged is scalars: the connection, the status or
   * the error's name and cause code; never a body.
   */
  async function send(
    request: Request,
    connection: OpenedConnection,
    secrets: readonly string[],
    deadlineMs: number,
  ): Promise<ProviderAnswer | Unreadable | Unreachable> {
    const where = { connectionId: connection.id, connector: connection.connector.id }
    // Outside the `try`: a deadline the timer refuses is the caller's mistake, not the provider down.
    const signal = AbortSignal.timeout(deadlineMs)
    try {
      const response = await deps.fetch(request, { signal })
      const { status } = response
      const bytes = await bodyOf(response)
      const answer = bytes === null ? null : answerOf(status, bytes, secrets)
      if (status >= 500) {
        deps.log.info({ ...where, status }, 'CONNECTOR_UNREACHABLE')
        return { kind: 'UNREACHABLE', native: nativeOf(status, answer?.body ?? null) }
      }
      return answer ?? { kind: 'UNREADABLE', native: nativeOf(status, null) }
    } catch (error) {
      const cause = unreachableCause(error)
      if (cause === undefined) throw error
      deps.log.info({ ...where, ...cause }, 'CONNECTOR_UNREACHABLE')
      return { kind: 'UNREACHABLE', native: null }
    }
  }

  return {
    async login(connection, deadlineMs) {
      const { connector } = connection
      const auth = connector.auth
      if (auth.kind !== 'client_credentials') throw new Error(`No pasted login for ${auth.kind}`)
      const values = valuesOf(connection)
      const request = toRequest(connector, tokenRequest(auth, values), null, originOf(connector))
      const sent = await send(request, connection, Object.values(values), deadlineMs)
      if ('kind' in sent) return sent
      const token = readToken(auth, sent)
      if (token.kind !== 'OK') return token
      return { kind: 'TOKEN', token: new Secret('BearerToken', token.accessToken) }
    },

    async call(connection, token, operation, input, deadlineMs) {
      const { connector } = connection
      const request = toRequest(
        connector,
        requestOf(operation, input, { ref: null }),
        token.reveal(),
        originOf(connector),
      )
      const secrets = [...Object.values(valuesOf(connection)), token.reveal()]
      const sent = await send(request, connection, secrets, deadlineMs)
      return 'kind' in sent ? sent : operation.answer(sent)
    },
  }
}
