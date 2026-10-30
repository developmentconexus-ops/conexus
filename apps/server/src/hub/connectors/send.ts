import { setTimeout as sleep } from 'node:timers/promises'
import type { Connector, ConnectorId, Native, ProviderAnswer } from '@conexus/connectors'
import type { ConnectionId, ConnectionSignInId } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { retryAfterMs } from '../../platform/retry-after.ts'
import type { Redaction, Unreadable } from './wire.ts'
import { answerOf, bodyOf, nativeOf, unreadable } from './wire.ts'

/** The provider could not be reached (or answered 5xx): `native` is what it said, when it said anything. */
export type Unreachable = Readonly<{ kind: 'UNREACHABLE'; native: Native | null }>

/** What a log line about one exchange with the provider names: the connection, or the authorization before it exists. */
export type Where = Readonly<
  { connector: ConnectorId } & ({ connectionId: ConnectionId } | { signInId: ConnectionSignInId })
>

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

export type ExecutorDeps = {
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
export async function send(
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
 * wait and one repeat on a fresh request, since a read's body (Sankhya's POST reads) is spent by the
 * first send. Only a read repeats (`repeat`): a write is never sent twice.
 */
export async function sendRead(
  deps: ExecutorDeps,
  requestFor: () => Request,
  where: Where,
  redaction: Redaction,
  a: Readonly<{ deadlineMs: number; repeat: boolean }>,
): Promise<ProviderAnswer | Unreadable | Unreachable> {
  const started = performance.now()
  const sent = await send(deps, requestFor(), where, redaction, a.deadlineMs)
  if (!a.repeat || 'kind' in sent || sent.status !== 429 || sent.retryAfterMs === undefined)
    return sent
  if (sent.retryAfterMs >= a.deadlineMs - (performance.now() - started) - 1) return sent
  await sleep(sent.retryAfterMs)
  const remaining = Math.floor(a.deadlineMs - (performance.now() - started))
  return send(deps, requestFor(), where, redaction, remaining)
}

export function unreachableAt(
  deps: ExecutorDeps,
  where: Where,
  status: number,
  body: unknown,
): Unreachable {
  deps.log.info({ ...where, status }, 'CONNECTOR_UNREACHABLE')
  return { kind: 'UNREACHABLE', native: nativeOf(status, body) }
}

/** Whose connection a call is about, for the log. */
export function whereOf(connection: { id: ConnectionId; connector: Connector }): Where {
  return { connectionId: connection.id, connector: connection.connector.id }
}
