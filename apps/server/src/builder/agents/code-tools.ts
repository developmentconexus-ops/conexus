import type { CompanyId, ToolFailureReason, ToolVersionId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connectors, SessionScope, TurnKey } from '../../hub/connectors/public.ts'
import { shaped } from '../../hub/connectors/public.ts'
import type { EdgeTools } from '../../platform/edge-tools.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { Tools } from '../tools/public.ts'
import type { CodeFrozenTool, FrozenTool } from './frozen.ts'

/** What an agent needs to call its saved tools (step 24.4): the edge, the Hub's live calls and the re-upload. */
export type CodeToolsDeps = {
  edge: EdgeTools
  calls: Connectors['tools']
  reupload: Tools['reupload']
  log: FailureLog
}

/** What the model hears of a call: the tool's result, cut as every read is, or why there is none. */
type CodeToolResult =
  | { kind: 'OK'; value: unknown; complete: boolean }
  | { kind: 'TOOL_FAILED'; reason: ToolFailureReason | 'NOT_STARTING' }
  | { kind: 'TOOL_UNAVAILABLE' }

const UNAVAILABLE = { kind: 'TOOL_UNAVAILABLE' } as const

function isCode(tool: FrozenTool): tool is CodeFrozenTool {
  return tool.kind === 'CODE'
}

/**
 * Calls the tool's Worker once; a Worker the namespace no longer holds ("Worker not found.") is
 * uploaded again from its version's module, within the turn, and called once more (the failure
 * table: the upload after a save may have failed, and the Worker's presence is not written).
 */
async function called(
  deps: CodeToolsDeps,
  at: { companyId: CompanyId; toolVersionId: ToolVersionId },
  call: Parameters<EdgeTools['call']>[0],
): Promise<CodeToolResult> {
  const first = await deps.edge.call(call)
  const answer =
    first.kind === 'MISSING'
      ? await (async () => {
          const uploaded = await deps.reupload(at.companyId, at.toolVersionId, call.signal)
          if (uploaded === 'NOT_STARTING') return { kind: 'NOT_STARTING' } as const
          return uploaded === 'UPLOADED' ? deps.edge.call(call) : first
        })()
      : first
  switch (answer.kind) {
    case 'OK':
      return { kind: 'OK', ...shaped(answer.value) }
    case 'FAILED':
      return { kind: 'TOOL_FAILED', reason: answer.reason }
    case 'NOT_STARTING':
      return { kind: 'TOOL_FAILED', reason: 'NOT_STARTING' }
    case 'MISSING':
    case 'UNAVAILABLE': {
      const { companyId, toolVersionId } = at
      deps.log.info({ companyId, toolVersionId, answer: answer.kind }, 'TOOL_CALL_UNAVAILABLE')
      return UNAVAILABLE
    }
    default:
      return answer satisfies never
  }
}

/**
 * The version's saved tools, one `createTool` each under `tool_<slug>` (step 24.4, U3): the input
 * schema the version kept, read once by `z.fromJSONSchema` (C27), and an `execute` that opens the
 * Hub's live call with the conversation's scope and the turn's key, calls the edge and closes it.
 * The tool's reads count in the turn's 50, with `connector_read`'s.
 */
export function codeTools(
  deps: CodeToolsDeps & {
    scope: SessionScope
    tools: readonly FrozenTool[]
    turnOf: (requestContext: RequestContext) => TurnKey
  },
): ToolsInput {
  const made = deps.tools.filter(isCode).map((tool) => {
    const id = `tool_${tool.slug}`
    const made = createTool({
      id,
      description: tool.description,
      inputSchema: z.fromJSONSchema(tool.inputSchema),
      execute: async (input, { requestContext, abortSignal }): Promise<CodeToolResult> => {
        const { toolVersionId, connectionId, reads } = tool
        // The agent always passes the run's context: a call without it has no turn to count in.
        if (requestContext === undefined) {
          deps.log.error({ toolVersionId }, 'TOOL_CALL_NO_CONTEXT')
          throw new Error('a saved tool was called without the run’s context')
        }
        const turn = deps.turnOf(requestContext)
        const live = deps.calls.open({
          scope: deps.scope,
          toolVersionId,
          connectionId,
          reads,
          turn,
        })
        try {
          return await called(
            deps,
            { companyId: deps.scope.companyId, toolVersionId },
            { toolVersionId, call: live.key, input, signal: abortSignal },
          )
        } finally {
          live.close()
        }
      },
    })
    return [id, made] as const
  })
  return Object.fromEntries(made)
}
