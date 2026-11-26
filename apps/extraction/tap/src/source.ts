import type {
  Connector,
  Credential,
  ProviderAnswer,
  ProviderSend,
  Session,
  TableSendFailure,
} from '@conexus/connectors'
import { openSession, parseJson, sessionOf, toRequest } from '@conexus/connectors'

const REDACTED = '[redacted]'

function retryAfterMs(headers: Headers, now: number): number | undefined {
  const ms = headers.get('retry-after-ms')
  if (ms !== null && /^\d+$/.test(ms)) return Number(ms)
  const after = headers.get('retry-after')
  if (after === null) return undefined
  if (/^\d+$/.test(after)) return Number(after) * 1000
  const date = Date.parse(after)
  return Number.isNaN(date) || date <= now ? undefined : date - now
}

/** What fetch documents for a provider out of reach: the network or a refused redirect (TypeError), or an abort. */
function isUnreachable(error: unknown): boolean {
  return (
    error instanceof TypeError || (error instanceof DOMException && error.name === 'AbortError')
  )
}

/** The request's own deadline ended, as `AbortSignal.timeout` documents it. */
function isTimedOut(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'TimeoutError'
}

function redacted(text: string, secrets: readonly string[]): string {
  return secrets
    .filter((secret) => secret !== '')
    .flatMap((secret) => [secret, JSON.stringify(secret).slice(1, -1)])
    .reduce((safe, secret) => safe.replaceAll(secret, REDACTED), text)
}

/**
 * The kit's request sent to the connector's origin, read as the connector declares its numbers. Every
 * answer loses the credential's values before it is read, as the Hub's reads do (`wire.ts`): the
 * Sankhya refuses at HTTP 200, and a refusal's message reaches the result file. A request that
 * outlasts `timeoutMs`, the body read included, ends as `DEADLINE`.
 */
export function senderOf(
  connector: Connector,
  a: Readonly<{
    fetch: typeof fetch
    credential: Credential
    now: () => number
    timeoutMs: number
  }>,
): ProviderSend<TableSendFailure> {
  const secrets = Object.values(a.credential)
  return async (request, { token, signal }): Promise<ProviderAnswer | TableSendFailure> => {
    let response: Response
    let text: string
    try {
      const deadline = AbortSignal.any([signal, AbortSignal.timeout(a.timeoutMs)])
      response = await a.fetch(toRequest(connector, request, token), { signal: deadline })
      text = await response.text()
    } catch (error) {
      if (isTimedOut(error)) return { kind: 'DEADLINE' }
      if (isUnreachable(error)) return { kind: 'UNREACHABLE' }
      throw error
    }
    const { status } = response
    const ok = status >= 200 && status < 300
    const wait = status === 429 ? retryAfterMs(response.headers, a.now()) : undefined
    const extra = wait === undefined ? {} : { retryAfterMs: wait }
    if (text === '') return { status, body: undefined, ...extra }
    const safe = redacted(text, secrets)
    try {
      return { status, body: parseJson(safe, connector.numbers), ...extra }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
      return ok ? { kind: 'UNREADABLE' } : { status, body: safe, ...extra }
    }
  }
}

type Opened = Readonly<{ kind: 'AUTH_REFUSED' }>

/**
 * The session of the run's credential. A login by fields signs in and renews by itself (shareable,
 * 0077); an OAuth grant is exclusive: the tap uses the token the Hub opened (`access`, as the seal
 * names it) and never renews it, so its end is the company connecting again.
 */
export function sessionFor(
  connector: Connector,
  a: Readonly<{ credential: Credential; send: ProviderSend<TableSendFailure>; now: () => number }>,
): Session<Readonly<{ kind: string }>> {
  const { auth } = connector
  if (auth.kind === 'client_credentials')
    return openSession({ auth, credential: a.credential, send: a.send, now: a.now })
  const access = a.credential.access
  return sessionOf<Opened>(
    {
      held:
        access === undefined
          ? null
          : { kind: 'TOKEN', token: access, expiresAt: Number.MAX_SAFE_INTEGER },
      open: async () => ({ kind: 'AUTH_REFUSED' }),
      end: async () => undefined,
    },
    a.now,
  )
}
