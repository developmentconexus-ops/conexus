import type { AppSessionToken, FailureCode, Operation } from '@conexus/hub-api'
import {
  APP_CONNECTOR_REPLY_BYTES,
  APP_SESSION_HEADER,
  callAppConnector,
  checkAppCall,
  createAppSession,
  listAppConnections,
  Problem,
} from '@conexus/hub-api'
import type { z } from 'zod'

/** Why the Hub gave no answer; it names no request data, so the log line can carry it (S41). */
export type NoAnswerReason =
  | 'TIMEOUT'
  | 'NETWORK'
  | 'TOO_LARGE'
  | 'UNREADABLE'
  | 'UNEXPECTED_STATUS'

/** What the Hub said: a refusal by its code, or no answer the dispatcher can read in time. */
export type HubAnswer<T> =
  | { kind: 'DONE'; value: T }
  | { kind: 'REFUSED'; code: FailureCode }
  | { kind: 'NO_ANSWER'; reason: NoAnswerReason }

type SessionRequest = z.infer<typeof createAppSession.input.body>
type CheckRequest = z.infer<typeof checkAppCall.input.query> & { session: AppSessionToken }
type CallRequest = Omit<z.infer<typeof callAppConnector.input.body>, 'deadlineMs'> & {
  session: AppSessionToken
}
type ConnectionsRequest = z.infer<typeof listAppConnections.input.query> & {
  session: AppSessionToken
}

/** The Hub's edge operations, the only ones the dispatcher calls (security S48). */
export type HubPort = {
  createAppSession(
    body: SessionRequest,
  ): Promise<HubAnswer<z.infer<typeof createAppSession.success.body>>>
  checkAppCall(input: CheckRequest): Promise<HubAnswer<z.infer<typeof checkAppCall.success.body>>>
  /** `deadlineMs` is what remains of the click, and the Hub is given no longer than that. */
  callAppConnector(
    input: CallRequest,
    deadlineMs: number,
  ): Promise<HubAnswer<z.infer<typeof callAppConnector.success.body>>>
  listAppConnections(
    input: ConnectionsRequest,
  ): Promise<HubAnswer<z.infer<typeof listAppConnections.success.body>>>
}

// Decision 0041: the VPC took 31 to 119 ms and the sleeping database takes up to 1.6 s; the
// deadline of 5 s covers both.
const HUB_CHECK_DEADLINE_MS = 5000
const REPLY_CAP_BYTES = 16 * 1024
// The VPC service fixes the host and the port: the URL only carries the path.
/** The deadline and the cap of the operations that answer a few fields. */
const SHORT_ANSWER = { deadlineMs: HUB_CHECK_DEADLINE_MS, capBytes: REPLY_CAP_BYTES }
const HUB_ORIGIN = 'http://hub:8081'

/** The reply's text, or nothing once it passes the cap (code C59); leaving the loop cancels the body. */
async function cappedText(
  body: ReadableStream<Uint8Array>,
  capBytes: number,
): Promise<string | undefined> {
  const decoder = new TextDecoder()
  let text = ''
  let size = 0
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > capBytes) return undefined
    text += decoder.decode(chunk, { stream: true })
  }
  return text + decoder.decode()
}

function parsedJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** The one adapter to the Hub over its VPC binding: no other file reads `env.HUB` (code C56). */
export function hubOf(env: Env): HubPort {
  async function call<S extends z.ZodType>(input: {
    operation: Operation & { success: { body: S } }
    url: string
    headers: Headers
    body?: string
    deadlineMs: number
    capBytes: number
  }): Promise<HubAnswer<z.infer<S>>> {
    try {
      const response = await env.HUB.fetch(`${HUB_ORIGIN}${input.url}`, {
        method: input.operation.method,
        headers: input.headers,
        body: input.body,
        signal: AbortSignal.timeout(input.deadlineMs),
      })
      const text = response.body === null ? '' : await cappedText(response.body, input.capBytes)
      if (text === undefined) return { kind: 'NO_ANSWER', reason: 'TOO_LARGE' }
      const json = parsedJson(text)
      if (response.status === input.operation.success.status) {
        const value = input.operation.success.body.safeParse(json)
        if (value.success) return { kind: 'DONE', value: value.data }
        return { kind: 'NO_ANSWER', reason: 'UNREADABLE' }
      }
      const problem = Problem.safeParse(json)
      if (problem.success) return { kind: 'REFUSED', code: problem.data.code }
      return { kind: 'NO_ANSWER', reason: 'UNEXPECTED_STATUS' }
    } catch (error) {
      // A lost connection, a passed deadline or a cut body: the Hub gave no answer to act on, and
      // the dispatcher's page logs why.
      const timedOut = error instanceof Error && error.name === 'TimeoutError'
      return { kind: 'NO_ANSWER', reason: timedOut ? 'TIMEOUT' : 'NETWORK' }
    }
  }

  return {
    createAppSession(body) {
      return call({
        operation: createAppSession,
        url: createAppSession.path,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
        ...SHORT_ANSWER,
      })
    },
    checkAppCall({ host, session }) {
      return call({
        operation: checkAppCall,
        url: `${checkAppCall.path}?${new URLSearchParams({ host })}`,
        headers: new Headers({ [APP_SESSION_HEADER]: session }),
        ...SHORT_ANSWER,
      })
    },
    callAppConnector({ session, ...body }, deadlineMs) {
      return call({
        operation: callAppConnector,
        url: callAppConnector.path,
        headers: new Headers({
          'Content-Type': 'application/json',
          [APP_SESSION_HEADER]: session,
        }),
        body: JSON.stringify({ ...body, deadlineMs }),
        deadlineMs,
        capBytes: APP_CONNECTOR_REPLY_BYTES,
      })
    },
    listAppConnections({ session, host, connector }) {
      return call({
        operation: listAppConnections,
        url: `${listAppConnections.path}?${new URLSearchParams({ host, connector })}`,
        headers: new Headers({ [APP_SESSION_HEADER]: session }),
        ...SHORT_ANSWER,
      })
    },
  }
}
