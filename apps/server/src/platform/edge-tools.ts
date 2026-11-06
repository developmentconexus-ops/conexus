import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ToolCallKey, ToolVersionId } from '@conexus/hub-api'
import { APP_CONNECTOR_REPLY_BYTES, ToolCallAnswer } from '@conexus/hub-api'
import { cappedText } from './capped-text.ts'
import type { Config } from './config.ts'
import type { FailureLog } from './failure.ts'

/** What the edge answered of a saved tool's call, or that it gave no answer the Hub can read in time. */
type EdgeToolAnswer = ToolCallAnswer | { kind: 'UNAVAILABLE' }

export type EdgeTools = {
  call(input: {
    toolVersionId: ToolVersionId
    call: ToolCallKey
    input: unknown
    signal?: AbortSignal
  }): Promise<EdgeToolAnswer>
}

const UNAVAILABLE = { kind: 'UNAVAILABLE' } as const

/** The edge's reply read by its contract, or why it could not be: text that is not JSON, or another shape. */
function answerOf(text: string): ToolCallAnswer | { why: 'not json' | 'shape' } {
  let json: unknown
  try {
    // biome-ignore lint/plugin: ToolCallAnswer.safeParse reads this value on the next lines (C27)
    json = JSON.parse(text)
  } catch {
    return { why: 'not json' }
  }
  const answer = ToolCallAnswer.safeParse(json)
  return answer.success ? answer.data : { why: 'shape' }
}

/**
 * The Hub's one call to the edge (code C56, step 24.4): a saved tool at the tools' host, past
 * Cloudflare Access with the service token, which leaves only in these requests (S36), under the
 * call's deadline of decision 0047. Access's refusal, a cut or late reply and an answer out of
 * the contract are `UNAVAILABLE`, logged by status and reason, never the input or the answer.
 */
export function createEdgeTools(deps: {
  config: Pick<Config, 'toolsOrigin' | 'toolsAccess'>
  log: FailureLog
  /** Only a test shortens it; decision 0047's 10 s otherwise. */
  deadlineMs?: number
}): EdgeTools {
  const { toolsOrigin, toolsAccess } = deps.config
  const deadlineMs = deps.deadlineMs ?? APP_CALL_LIMITS.callDeadlineMs
  return {
    async call({ toolVersionId, call, input, signal }) {
      const timeout = AbortSignal.timeout(deadlineMs)
      try {
        const response = await fetch(`${toolsOrigin}/${toolVersionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Access-Client-Id': toolsAccess.clientId.reveal(),
            'CF-Access-Client-Secret': toolsAccess.clientSecret.reveal(),
          },
          body: JSON.stringify({ call, input }),
          redirect: 'manual',
          signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
        })
        const text = await cappedText(response.body, APP_CONNECTOR_REPLY_BYTES)
        const read =
          response.status !== 200
            ? { why: 'status' }
            : text === undefined
              ? { why: 'past cap' }
              : answerOf(text)
        if ('kind' in read) return read
        deps.log.error(
          { toolVersionId, status: response.status, reason: read.why },
          'EDGE_TOOLS_FAILED',
        )
        return UNAVAILABLE
      } catch (error) {
        const reason = error instanceof Error ? error.name : 'unknown'
        deps.log.error({ toolVersionId, reason }, 'EDGE_TOOLS_FAILED')
        return UNAVAILABLE
      }
    },
  }
}
