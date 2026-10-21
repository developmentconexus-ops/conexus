import { createTool, webFetchTool } from '@mastra/core/tools'

/**
 * Mastra's `web_fetch`, answering for itself that it needs no approval: the categories' rules allow
 * it, and a tool's own answer is the one the run's `requireToolApproval` yields to, so the call runs
 * at once instead of parking the run to be approved by the rule.
 */
export const webFetch = createTool({
  id: webFetchTool.id,
  description: webFetchTool.description,
  inputSchema: webFetchTool.inputSchema,
  outputSchema: webFetchTool.outputSchema,
  execute: webFetchTool.execute,
  requireApproval: () => false,
})
