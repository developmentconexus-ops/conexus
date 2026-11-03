import type { ConnectionId } from '@conexus/hub-api'
import { ASSISTANT_TOOL, ProposedAutomation } from '@conexus/hub-api'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { connectionField } from '../connectors/public.ts'

/**
 * `propose_automation` (step 24.2, U3, `E1`): when what the person asks repeats at a time, the
 * Assistant writes the automation and the screen shows **Criar automação**. The tool creates
 * nothing: it answers the proposal, which Mastra stores with the call and the screen draws. The
 * place is the conversation's. The model knows the connections by name, so it names them, from an
 * enumeration of the conversation's chosen ones made per request, as `connector_read` does; the
 * tool answers their ids. A name the conversation did not choose is refused by the schema, which
 * tells the model the names there are. Two chosen connections of one name are both read.
 */
export function proposeAutomationTool(
  chosen: readonly { connectionId: ConnectionId; name: string }[],
) {
  return createTool({
    id: ASSISTANT_TOOL.proposeAutomation,
    description:
      "Offers the person a button, Criar automação, to run something on a schedule: every day, on weekdays, on chosen days of the week or on a day of the month, always at a time of day in São Paulo. Call it in the turn in which the person asks for something that repeats at a time, such as a report every Monday; the card shows the prompt, the time and the connections, and nothing is made until they touch it. When the request leaves open what to report or by which rule, such as the clients to call with no rule for who, do not ask first, also where a connector's skill says to ask: write the prompt so that each run settles it from the company's data and states the rule it used, and say in one sentence which reading you chose, so the person can ask for another before touching the button. Write the prompt to be understood alone, without this conversation: it is asked to you in a new conversation at each time. Name the connections the prompt reads, from those this conversation chose.",
    inputSchema: ProposedAutomation.extend({
      connections: z.array(connectionField(chosen)).max(chosen.length),
    }),
    execute: async (proposal): Promise<ProposedAutomation> => ({
      ...proposal,
      connections: chosen
        .filter((each) => proposal.connections.includes(each.name))
        .map((each) => each.connectionId),
    }),
  })
}
