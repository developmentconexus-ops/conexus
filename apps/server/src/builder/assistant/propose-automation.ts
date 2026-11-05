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
      "Offers the person a button, Criar automação, to run something on a schedule: every day, on weekdays, on chosen days of the week or on a day of the month, always at a time of day in São Paulo. The card shows the prompt, the time and the connections, and nothing is made until they touch it. Call it in the turn in which the person asks for something that repeats at a time and the request is clear enough to run alone: each run is asked to you in a new conversation, with no one there to answer a question. When something that changes what each run does, such as what to report or by which rule, is settled neither by the company's data nor by this conversation, ask one short question with the options you found in the data, and call this tool in the turn in which the person answers; never a list of questions. What a sensible default settles needs no question: write the default in the prompt. Write the prompt to be understood alone, without this conversation. Name the connections the prompt reads, from those this conversation chose.",
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
