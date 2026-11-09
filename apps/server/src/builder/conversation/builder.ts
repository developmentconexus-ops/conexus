import type { ModelId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { createCodingAgent } from '@mastra/core/coding-agent'
import type { RequestContext } from '@mastra/core/request-context'
import { webFetchTool, webSearchTool } from '@mastra/core/tools'
import { Memory } from '@mastra/memory'
import type { PostgresStore } from '@mastra/pg'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { BuilderConnectors, GrantedConnection } from '../connectors/public.ts'
import { builderAccess, connectorTools } from '../connectors/public.ts'
import {
  agentDefaults,
  controllerOf,
  conversationMemory,
  oncePerRun,
  sessionModel,
  sideTurn,
  toolsOf,
} from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { accountModel, chosenModel, providerOf } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { APP_SKILLS, builderInstructions, skillOf } from './instructions.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import {
  ASK_USER_TOOL,
  createAskUserTool,
  createSubmitPlanTool,
  SUBMIT_PLAN_TOOL,
} from './plan-tools.ts'
import { checkTool, conexusCheck } from './processors.ts'
import type { ConversationIndex } from './turn-of.ts'
import { projectIn, turnOf } from './turn-of.ts'

const CONVERSATION_MODE = 'conversa'

const TITLE_INSTRUCTIONS =
  'Dê à conversa um título curto em português, de até seis palavras, sem aspas nem ponto final.'
/** The observer's title guidance names no language (Conexus OS `e0353c36` `builder/memory.ts:28`). */
const OBSERVER_INSTRUCTION =
  'Escreva o título da conversa em português do Brasil, sobre o que a pessoa quer construir ou mudar no app.'
/**
 * The Projeto's granted connections for a Mastra run, read once for its tools, its skills and its
 * instructions: Mastra resolves each of them with the run's `RequestContext`, and a resumed run
 * brings a new one, so a grant taken between two turns is gone in the next.
 */
function grantedFor(
  port: BuilderConnectors,
  projectOf: ReturnType<typeof projectIn>,
): (requestContext: RequestContext) => Promise<readonly GrantedConnection[]> {
  return oncePerRun(async (requestContext) => {
    const ids = await projectOf(requestContext)
    return ids === undefined ? [] : port.granted(ids)
  })
}

/** The Builder's three connector tools, its notebook's write included. */
function builderConnectorTools(
  deps: { connectors: BuilderConnectors; runs: Runs; log: FailureLog },
  granted: readonly GrantedConnection[],
  ids: Omit<Parameters<typeof builderAccess>[2], 'runIdOf'>,
): ToolsInput {
  const who = { ...ids, runIdOf: (context: RequestContext) => deps.runs.runIdOf(context) }
  const { access, save } = builderAccess(deps.connectors, granted, who, deps.log)
  return connectorTools(access, { noteSave: true, save })
}

/** The Builder's memory words, and its recall of what the observation folded. */
const BUILDER_MEMORY = {
  title: TITLE_INSTRUCTIONS,
  observer: OBSERVER_INSTRUCTION,
  recall: true,
} as const

/**
 * The Builder (decision 0050): one agent shared by every conversation, its keyless model taken
 * from the session and given its account by the queue's processors, its memory, its title and its
 * observation through the same account, in Mastra's own database. It is Mastra Code's agent
 * (`sdk/src/index.ts:1216-1223`): no workspace of its own, since the controller lends the turn's
 * machine, and the task list's signal with `memory`.
 */
export function createBuilder(deps: {
  storage: PostgresStore
  queue: QueueDeps
  runs: Runs
  index: ConversationIndex
  connectors: BuilderConnectors
  log: FailureLog
  projectName: Parameters<typeof builderInstructions>[0]['projectName']
}) {
  const { storage } = deps
  const check = checkTool(deps.runs)
  const projectOf = projectIn(deps.index)
  const granted = grantedFor(deps.connectors, projectOf)
  const { queue } = deps
  const defaults = agentDefaults(queue, { processor: turnOf(deps) })
  const memory = conversationMemory({ storage, queue, ...BUILDER_MEMORY })
  const agent = createCodingAgent({
    id: BUILDER_CONTROLLER,
    name: 'Builder',
    instructions: builderInstructions({
      runs: deps.runs,
      projectOf,
      projectName: deps.projectName,
      granted,
    }),
    skills: async ({ requestContext }) => [
      ...APP_SKILLS,
      ...(await granted(requestContext)).map((each) =>
        skillOf({ directory: each.skill.name, ...each.skill }),
      ),
    ],
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: async ({ requestContext }) => {
      const ids = await projectOf(requestContext)
      const web = toolsOf(sessionModel(requestContext))
      // The order of step 20 (criterion 13a): the model's request stays byte for byte the same.
      return {
        web_fetch: webFetchTool,
        [BUILDER_TOOL.check]: check,
        ...web,
        ...(ids === undefined
          ? {}
          : builderConnectorTools(deps, await granted(requestContext), ids)),
      }
    },
    ...defaults,
    workspace: undefined,
    defaultOptions: {
      ...defaults.defaultOptions,
      isTaskComplete: {
        scorers: [conexusCheck({ runs: deps.runs, storage })],
        strategy: 'all',
      },
    },
    memory,
  })
  const controller = controllerOf({
    ...{ kind: 'builder', storage, memory, agent },
    mode: { id: CONVERSATION_MODE, availableTools: TOOL_CLOSURE.availableTools },
    // The conversation's machine (Factory `session-sandbox.ts:29-36`); none outside a conversation.
    workspace: async ({ requestContext, mastra }) => {
      const ids = await projectOf(requestContext)
      return ids === undefined ? undefined : deps.runs.workspaceOf(ids, mastra)
    },
    // `ask_user` and `submit_plan` are ours, under the native ids (`plan-tools.ts`).
    tools: { [ASK_USER_TOOL]: createAskUserTool(), [SUBMIT_PLAN_TOOL]: createSubmitPlanTool() },
    initialState: TOOL_CLOSURE.initialState,
  })
  return { controller, memory, agent, queue: deps.queue }
}

export type Builder = ReturnType<typeof createBuilder>
