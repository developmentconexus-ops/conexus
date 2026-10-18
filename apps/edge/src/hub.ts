import type { AppSessionToken, FailureCode, Operation } from '@conexus/hub-api'
import { APP_SESSION_HEADER, checkAppCall, createAppSession, Problem } from '@conexus/hub-api'
import type { z } from 'zod'

/** What the Hub said: a refusal by its code, or no answer the dispatcher can read in time. */
type HubAnswer<T> =
  | { kind: 'DONE'; value: T }
  | { kind: 'REFUSED'; code: FailureCode }
  | { kind: 'NO_ANSWER' }

type SessionRequest = z.infer<typeof createAppSession.input.body>
type CheckRequest = z.infer<typeof checkAppCall.input.query> & { session: AppSessionToken }

/** The Hub's edge operations, the only ones the dispatcher calls (security S48). */
export type HubPort = {
  createAppSession(
    body: SessionRequest,
  ): Promise<HubAnswer<z.infer<typeof createAppSession.success.body>>>
  checkAppCall(input: CheckRequest): Promise<HubAnswer<z.infer<typeof checkAppCall.success.body>>>
}

// Decision 0041 measured 31 to 119 ms through Workers VPC; the deadline is about forty
// times the slowest.
const HUB_CHECK_DEADLINE_MS = 5000
const REPLY_CAP_BYTES = 16 * 1024
// The VPC service fixes the host and the port: the URL only carries the path.
const HUB_ORIGIN = 'http://hub:8081'

/** The reply's text, or nothing once it passes the cap (code C59); leaving the loop cancels the body. */
async function cappedText(body: ReadableStream<Uint8Array>): Promise<string | undefined> {
  const decoder = new TextDecoder()
  let text = ''
  let size = 0
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > REPLY_CAP_BYTES) return undefined
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
  }): Promise<HubAnswer<z.infer<S>>> {
    try {
      const response = await env.HUB.fetch(`${HUB_ORIGIN}${input.url}`, {
        method: input.operation.method,
        headers: input.headers,
        body: input.body,
        signal: AbortSignal.timeout(HUB_CHECK_DEADLINE_MS),
      })
      const text = response.body === null ? '' : await cappedText(response.body)
      if (text === undefined) return { kind: 'NO_ANSWER' }
      const json = parsedJson(text)
      if (response.status === input.operation.success.status) {
        const value = input.operation.success.body.safeParse(json)
        return value.success ? { kind: 'DONE', value: value.data } : { kind: 'NO_ANSWER' }
      }
      const problem = Problem.safeParse(json)
      return problem.success ? { kind: 'REFUSED', code: problem.data.code } : { kind: 'NO_ANSWER' }
    } catch {
      // A lost connection, a passed deadline or a cut body: the Hub gave no answer to act on, and
      // the dispatcher's page logs it.
      return { kind: 'NO_ANSWER' }
    }
  }

  return {
    createAppSession(body) {
      return call({
        operation: createAppSession,
        url: createAppSession.path,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      })
    },
    checkAppCall({ host, session }) {
      return call({
        operation: checkAppCall,
        url: `${checkAppCall.path}?${new URLSearchParams({ host })}`,
        headers: new Headers({ [APP_SESSION_HEADER]: session }),
      })
    },
  }
}
