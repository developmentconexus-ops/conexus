import type {
  Answered,
  Connector,
  ConnectorId,
  Operation,
  ProviderAnswer,
} from '@conexus/connectors'
import { readToken, requestOf, tokenRequest, toRequest } from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
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

type Unreachable = Readonly<{ kind: 'UNREACHABLE' }>
type Login =
  | Readonly<{ kind: 'TOKEN'; token: BearerToken } | { kind: 'AUTH_REFUSED' }>
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

const UNREACHABLE: Unreachable = { kind: 'UNREACHABLE' }
type Unreadable = Readonly<{ kind: 'UNREADABLE' }>
const UNREADABLE: Unreadable = { kind: 'UNREADABLE' }

/** The opened values, checked again by the connector's own schema: a value it refuses never opened. */
function valuesOf(connection: OpenedConnection): Readonly<Record<string, string>> {
  const { credential } = connection.connector.auth
  try {
    return credential.parse(JSON.parse(connection.credential.reveal()))
  } catch (cause) {
    throw new Failure('SEAL_REFUSED', { details: { reason: 'credential shape' }, cause })
  }
}

/** The body, read in pieces up to the cap; past it the read is cancelled and nothing is kept. */
async function bodyOf(response: Response): Promise<Uint8Array | Unreadable> {
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
      return UNREADABLE
    }
    chunks.push(value)
  }
}

/** The JSON read only at the end; a body that is not JSON is unreadable, never an empty answer. */
function answerOf(status: number, bytes: Uint8Array): ProviderAnswer | Unreadable {
  if (bytes.byteLength === 0) return { status, body: undefined }
  try {
    return { status, body: z.unknown().parse(JSON.parse(Buffer.from(bytes).toString('utf8'))) }
  } catch {
    return UNREADABLE
  }
}

export function createExecutor(deps: {
  fetch: typeof fetch
  origins: ReadonlyMap<ConnectorId, string>
}): Executor {
  function originOf(connector: Connector): string {
    return deps.origins.get(connector.id) ?? connector.origin
  }

  /**
   * Sends one request (the OS's `send`): a redirect refused by fetch, a 5xx's body cancelled unread,
   * the rest read up to the cap and parsed only at the end. The provider's body is never logged.
   */
  async function send(
    request: Request,
    deadlineMs: number,
  ): Promise<ProviderAnswer | Unreadable | Unreachable> {
    // Outside the `try`: a deadline the timer refuses is the caller's mistake, not the provider down.
    const signal = AbortSignal.timeout(deadlineMs)
    try {
      const response = await deps.fetch(request, { signal })
      if (response.status >= 500) {
        await response.body?.cancel()
        return UNREACHABLE
      }
      const body = await bodyOf(response)
      return 'kind' in body ? body : answerOf(response.status, body)
    } catch {
      return UNREACHABLE
    }
  }

  return {
    async login(connection, deadlineMs) {
      const { connector } = connection
      const auth = connector.auth
      const request = toRequest(
        connector,
        tokenRequest(auth, valuesOf(connection)),
        null,
        originOf(connector),
      )
      const sent = await send(request, deadlineMs)
      // A login answered with what the kit cannot read is the provider's fault, not the key's.
      if ('kind' in sent) return UNREACHABLE
      const token = readToken(auth, sent)
      if (token.kind === 'AUTH_REFUSED') return token
      if (token.kind === 'UNREADABLE') return UNREACHABLE
      return { kind: 'TOKEN', token: new Secret('BearerToken', token.accessToken) }
    },

    async call(connection, token, operation, input, deadlineMs) {
      const { connector } = connection
      const request = toRequest(
        connector,
        requestOf(operation, input),
        token.reveal(),
        originOf(connector),
      )
      const sent = await send(request, deadlineMs)
      return 'kind' in sent ? sent : operation.answer(sent)
    },
  }
}
