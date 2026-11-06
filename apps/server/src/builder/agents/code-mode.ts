import type { ToolsInput } from '@mastra/core/agent'
import type { CodeModeTransport } from '@mastra/core/tools'
import { createCodeMode } from '@mastra/core/tools'

/**
 * The program tool over the agent's tools (step 24.4, U5): the model writes one function that calls
 * them as `external_<id>`, and the tools keep running here, in the turn, under its limit of 50. It
 * names no sandbox: the program runs in the machine of the agent's workspace, by `transport`.
 *
 * The program's timeout stays Mastra's 30 s. The measure of criterion 21 ran its programs with
 * 60 s, and its longest whole run (three programs and the model between them) took 33.1 s, so no
 * program came near 30 s; nothing in it asks for another value.
 */
export function codeModeOf(
  tools: ToolsInput,
  transport: CodeModeTransport,
): ReturnType<typeof createCodeMode> {
  return createCodeMode({ tools }, transport)
}
