import type { ToolsInput } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connectors, SessionScope, TurnKey } from '../../hub/connectors/public.ts'
import type { FrozenVersion } from './frozen.ts'

const NOT_GRANTED = { kind: 'NOT_GRANTED' } as const

/**
 * The input the model fills: only the version's open fields of the read's own input. A connection
 * the Projeto no longer offers has no input to read, and its call answers `NOT_GRANTED`.
 */
async function openInput(
  connectors: Pick<Connectors['assistant'], 'operationOf'>,
  scope: SessionScope,
  tool: FrozenVersion['tools'][number],
) {
  const input = await connectors.operationOf(scope, tool)
  if (input === undefined) return undefined
  const open = new Set(tool.open)
  return z.object(
    Object.fromEntries(Object.entries(input.shape).filter(([field]) => open.has(field))),
  )
}

/**
 * The version's tools, one `createTool` each under `tool_<slug>` (step 24.3), as the version holds
 * them: its call goes through the company's door with the fixed values over what the model sent,
 * so the model never changes one, counted in the turn's 50 calls; the model gets the cut, never the
 * whole answer.
 */
export async function presetTools(deps: {
  connectors: Pick<Connectors['assistant'], 'operationOf' | 'read'>
  scope: SessionScope
  tools: FrozenVersion['tools']
  turnOf: (requestContext: RequestContext) => TurnKey
}): Promise<ToolsInput> {
  const made = await Promise.all(
    deps.tools.map(async (tool) => {
      const id = `tool_${tool.slug}`
      const inputSchema = await openInput(deps.connectors, deps.scope, tool)
      const made = createTool({
        id,
        description: tool.description,
        inputSchema: inputSchema ?? z.object({}),
        execute: async (input, { requestContext, abortSignal }) => {
          if (inputSchema === undefined || requestContext === undefined) return NOT_GRANTED
          const answered = await deps.connectors.read(deps.scope, {
            connectionId: tool.connectionId,
            operation: tool.operation,
            input: { ...input, ...tool.bound },
            turn: deps.turnOf(requestContext),
            signal: abortSignal,
          })
          if (answered.kind !== 'OK') return answered
          const { whole: _whole, ...cut } = answered
          return cut
        },
      })
      return [id, made] as const
    }),
  )
  return Object.fromEntries(made)
}
