import type { ToolsInput } from '@mastra/core/agent'
import type { CodeModeTransport } from '@mastra/core/tools'
import { createCodeMode } from '@mastra/core/tools'

/**
 * The program tool over the agent's tools (step 24.4, U5): the model writes one function that calls
 * them as `external_<id>`, and the tools keep running here, in the turn, under its limit of 50. It
 * names no sandbox: the program runs in the machine of the agent's workspace, by `transport`.
 */
export function codeModeOf(
  tools: ToolsInput,
  transport: CodeModeTransport,
): ReturnType<typeof createCodeMode> {
  return createCodeMode({ tools }, transport)
}
