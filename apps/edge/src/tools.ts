// The saved tools' host (step 24.4): the Hub calls `tools.<APPS_DOMAIN>/<toolVersionId>` past
// Cloudflare Access, and the dispatcher runs that version's Worker `t-<id>` with only `data`.

import type { ToolProps } from '@conexus/app-contract'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { ToolCallAnswer, ToolCallKey, ToolFailureReason } from '@conexus/hub-api'
import {
  APP_CONNECTOR_REPLY_BYTES,
  CALL_DEADLINE_MS,
  ToolFailureReason as Reason,
  ToolCall,
  ToolVersionId,
  toolWorkerOf,
} from '@conexus/hub-api'
import { DISPATCH_OPTIONS, deadlineOf } from './dispatch.ts'
import type { HubPort } from './hub.ts'
import { cappedText } from './hub.ts'

/** The host's one label, which never parses as an app's two-part label (`HostLabel`). */
export const TOOLS_LABEL = 'tools'
// The Hub sends a tool's input and the call's key; the input is the model's, a few fields.
const CALL_BYTES = 64 * 1024

/** What the dispatcher binds one tool call's `data` to; the tool reads none of it. */
export type ToolDataProps = Readonly<{
  toolVersionId: ToolVersionId
  call: ToolCallKey
  endsAt: number
}>

/** What the host needs of the dispatcher's exports: the `data` stub of one call. */
export type ToolExports = { ToolData(options: { props: ToolDataProps }): ToolProps['data'] }

/** The Access context of the request, as the runtime gives it: none when Access did not authenticate it. */
type AccessContext = { aud: string } | undefined

function answered(answer: ToolCallAnswer): Response {
  return Response.json(answer)
}

function failed(reason: ToolFailureReason): Response {
  console.error(JSON.stringify({ level: 50, msg: 'TOOL_CALL_FAILED', reason }))
  return answered({ kind: 'FAILED', reason })
}

/**
 * A tool's `data` (`ToolProps`): one read through the Hub, which knows the call by its key, in the
 * time that remains of it; any answer but `OK` rejects with its code, which a tool that does not
 * catch it hands back as its failure.
 */
export function toolDataOf(hub: HubPort, props: ToolDataProps): ToolProps['data'] {
  return {
    async read(operation, input) {
      const left = Math.min(Math.floor(props.endsAt - Date.now()), CALL_DEADLINE_MS)
      if (left < 1) throw new Error('DEADLINE')
      const { toolVersionId, call } = props
      const answer = await hub.callToolConnector({ toolVersionId, call, operation, input }, left)
      if (answer.kind === 'DONE') {
        if (answer.value.kind === 'OK') return answer.value.value
        throw new Error(answer.value.kind)
      }
      if (answer.kind === 'NO_ANSWER' && answer.reason === 'TIMEOUT') throw new Error('DEADLINE')
      const reason = answer.kind === 'REFUSED' ? answer.code : answer.reason
      console.error(JSON.stringify({ level: 50, msg: 'TOOL_HUB_NO_ANSWER', reason }))
      throw new Error('UNREACHABLE')
    },
  }
}

/**
 * Why the tool's call threw, from the message alone: the namespace's "Worker not found.", the
 * platform's CPU limit, or a code `data.read` rejected with; any other is the tool's own throw.
 */
function thrown(error: unknown): ToolCallAnswer {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('Worker not found')) return { kind: 'MISSING' }
  if (message.includes('exceeded CPU time limit')) return { kind: 'FAILED', reason: 'CPU' }
  const code = Reason.safeParse(message.replace(/^Error: /, ''))
  return { kind: 'FAILED', reason: code.success ? code.data : 'THREW' }
}

/** The tool's answer, its JSON as it gave it, up to the Hub's own cap (code C59). */
async function resultOf(response: Response): Promise<ToolCallAnswer> {
  if (!response.ok || response.body === null) return { kind: 'FAILED', reason: 'STATUS' }
  const text = await cappedText(response.body, APP_CONNECTOR_REPLY_BYTES)
  if (text === undefined) return { kind: 'FAILED', reason: 'NOT_JSON' }
  try {
    return { kind: 'OK', value: JSON.parse(text) }
  } catch {
    return { kind: 'FAILED', reason: 'NOT_JSON' }
  }
}

/**
 * Every request to the tools' host. Access answers first: a request it did not authenticate for
 * this application never reaches a Worker (403). Then the version's Worker runs under the apps'
 * limits and the outbound wall (decision 0047), with only `data`, and its answer goes back as
 * `ToolCallAnswer`; the call's deadline ends it as `toApp` does.
 */
export async function serveTool(
  request: Request,
  env: Env,
  exports: ToolExports,
  access: AccessContext,
): Promise<Response> {
  if (access === undefined || access.aud !== env.TOOLS_ACCESS_AUD) {
    return new Response(null, { status: 403 })
  }
  const id = ToolVersionId.safeParse(new URL(request.url).pathname.slice(1))
  if (request.method !== 'POST' || !id.success || request.body === null) {
    return new Response(null, { status: 404 })
  }
  const text = await cappedText(request.body, CALL_BYTES)
  const body = text === undefined ? undefined : ToolCall.safeParse(parsedJson(text))
  if (!body?.success) return new Response(null, { status: 400 })
  const deadline = deadlineOf(APP_CALL_LIMITS.callDeadlineMs)
  try {
    const props = { toolVersionId: id.data, call: body.data.call, endsAt: deadline.endsAt }
    const tool = env.TOOLS.get(
      toolWorkerOf(id.data),
      { props: { data: exports.ToolData({ props }) } satisfies ToolProps },
      DISPATCH_OPTIONS,
    )
    const input = JSON.stringify(body.data.input ?? null)
    const response = await Promise.race([
      tool.fetch('https://tool/', { method: 'POST', body: input }),
      deadline.passed,
    ])
    if (response === 'PASSED') return failed('DEADLINE')
    const result = await resultOf(response)
    return result.kind === 'FAILED' ? failed(result.reason) : answered(result)
  } catch (error) {
    const result = thrown(error)
    return result.kind === 'FAILED' ? failed(result.reason) : answered(result)
  } finally {
    deadline.end()
  }
}

function parsedJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
