import { ASSISTANT_TOOL, ProposedAutomation } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import type { SessionScope } from '../../hub/connectors/public.ts'

/**
 * `propose_automation` (step 24.2, U3, `E1`): when what the person asks repeats at a time, the
 * Assistant writes the automation and the screen shows **Criar automação**. The tool creates
 * nothing: it answers the proposal, which Mastra stores with the call and the screen draws, keeping
 * only the connections this conversation chose. The place is the conversation's.
 */
export function proposeAutomationTool(deps: {
  scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
}) {
  return createTool({
    id: ASSISTANT_TOOL.proposeAutomation,
    description:
      'Offers the person a button, Criar automação, to run something on a schedule: every day, on weekdays, on chosen days of the week or on a day of the month, always at a time of day in São Paulo. Call it when what they ask repeats at a time, such as a report every Monday. Write the prompt to be understood alone, without this conversation: it is asked to you in a new conversation at each time. Name the connections the prompt reads, from those this conversation chose.',
    inputSchema: ProposedAutomation,
    execute: async (proposal, { requestContext }): Promise<ProposedAutomation> => {
      const scope = requestContext === undefined ? undefined : await deps.scopeOf(requestContext)
      const chosen = new Set(scope?.chosen)
      return {
        ...proposal,
        connections: proposal.connections.filter((each) => chosen.has(each)),
      }
    },
  })
}
