import { BUILDER_TOOL, SUBAGENT_TOOL, WORKSPACE_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { AgentControllerSubagent } from '@mastra/core/agent-controller'
import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { connectorTools } from '../connectors/public.ts'
import { TURN_ACCOUNT } from '../model-accounts/public.ts'
import { assistantAccess } from './connector-access.ts'

/** The helper's type: it reads the systems the conversation chose and the machine's files, and writes nothing. */
const RESEARCH_TYPE = 'pesquisar'

/**
 * The Assistant's one subagent type (U12), on Mastra's `subagent` tool: it runs in its own context
 * and returns only its findings. Its tools are the ones this type names (Mastra gives a subagent no
 * `subagent`, so it opens none), and its reads are the four of the Mastra Code `explore`.
 */
export const RESEARCH: AgentControllerSubagent = {
  id: RESEARCH_TYPE,
  name: 'Pesquisa',
  description:
    'Reads the company systems chosen in this conversation and the files on its machine to answer one focused question, and returns the findings with where each number came from. Writes nothing.',
  instructions: `You answer one research task for Conexus's Assistant and only read. Use \`${BUILDER_TOOL.connectorRead}\` with the connection, the reads, the fields, the period and the codes the task gives; filter and count at the system (WHERE, COUNT, SUM) rather than reading every row; open the saved file of a long read with the file tools. Return, in Brazilian Portuguese, the findings first, then each number with the read or file it came from; say what you could not read and why; mark what is your inference. You cannot see the conversation: work only from the task.`,
  allowedControllerTools: [BUILDER_TOOL.connectorRead],
  allowedWorkspaceTools: [
    WORKSPACE_TOOL.readFile,
    WORKSPACE_TOOL.listFiles,
    WORKSPACE_TOOL.fileStat,
    WORKSPACE_TOOL.grep,
  ],
  defaultModelId: TURN_ACCOUNT,
}

/**
 * The helper's `connector_read` for a run (U12): the same tool the Builder has, bound to the scope
 * and the connections the conversation chose when the run began. It is a tool of the controller,
 * built for each run, because the helper's context cannot find the conversation; the mode's closed
 * set keeps it out of the main agent's request.
 */
export function researchReads(
  deps: { connectors: Connectors['assistant']; log: FailureLog },
  a: {
    scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
    chosenOf: (
      requestContext: RequestContext,
    ) => Promise<Parameters<typeof assistantAccess>[1]['chosen']>
    savedAt: (requestContext: RequestContext) => string
  },
): (input: { requestContext: RequestContext }) => Promise<ToolsInput> {
  return async ({ requestContext }): Promise<ToolsInput> => {
    const scope = await a.scopeOf(requestContext)
    if (scope === undefined) return {}
    const access = assistantAccess(deps, {
      scope,
      chosen: await a.chosenOf(requestContext),
      savedAt: a.savedAt,
    })
    const { [BUILDER_TOOL.connectorRead]: read } = connectorTools(access, { noteSave: false })
    return read === undefined ? {} : { [BUILDER_TOOL.connectorRead]: read }
  }
}

const NativeSubagent = z.object({
  description: z.string(),
  execute: z.custom<(input: object, context: object) => Promise<unknown>>(
    (value) => typeof value === 'function',
  ),
})

/**
 * The Assistant's `subagent` tool closed to what it uses: Mastra's own accepts `forked` and
 * `modelId` from the model, and `forked: true` would run the main agent itself, with its tools and
 * a thousand steps. This copy takes the type and the task only and calls Mastra's `execute` not
 * forked and with no model id, so Mastra still runs the helper (U12).
 */
export const researchOnly: InputProcessor = {
  id: 'conexus-research-only',
  processInputStep({ tools }) {
    const native = NativeSubagent.safeParse(tools?.[SUBAGENT_TOOL])
    if (tools === undefined || !native.success) return {}
    const { description, execute } = native.data
    const closed = createTool({
      id: SUBAGENT_TOOL,
      description,
      inputSchema: z.object({
        agentType: z.enum([RESEARCH_TYPE]).describe('Type of subagent to spawn'),
        task: z
          .string()
          .describe(
            'Clear, self-contained description of what the subagent should do. The subagent cannot see this conversation: include all relevant context.',
          ),
      }),
      execute: ({ agentType, task }, context) =>
        execute({ agentType, task, forked: false }, context),
    })
    return { tools: { ...tools, [SUBAGENT_TOOL]: closed } }
  },
}
