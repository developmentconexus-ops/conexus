import type { CompanyId, ModelId, PersonId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { BuiltinToolId } from '@mastra/core/agent-controller'
import { AgentController } from '@mastra/core/agent-controller'
import { createCodingAgent } from '@mastra/core/coding-agent'
import { CyberRefusalHandler } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { webFetchTool, webSearchTool } from '@mastra/core/tools'
import { Memory } from '@mastra/memory'
import type { PostgresStore } from '@mastra/pg'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { BuilderConnectors, GrantedConnection } from '../connectors/public.ts'
import { builderAccess, connectorTools } from '../connectors/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import {
  accountErrorProcessors,
  accountModel,
  accountPick,
  chosenModel,
  MAX_PROCESSOR_RETRIES,
  providerOf,
} from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { APP_SKILLS, builderInstructions, skillOf } from './instructions.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import {
  ASK_USER_TOOL,
  createAskUserTool,
  createSubmitPlanTool,
  SUBMIT_PLAN_TOOL,
} from './plan-tools.ts'
import { checkTool, conexusCheck, workspaceMetadataLive } from './processors.ts'
import type { ConversationIndex } from './turn-of.ts'
import { projectIn, sideTurn, turnOf } from './turn-of.ts'

/** The Builder's controller, as Mastra's routes name it (`/agent-controller/builder/…`). */
export const BUILDER_ID = BUILDER_CONTROLLER
const CONVERSATION_MODE = 'conversa'

const TITLE_INSTRUCTIONS =
  'Dê à conversa um título curto em português, de até seis palavras, sem aspas nem ponto final.'
/** The observer's title guidance names no language (Conexus OS `e0353c36` `builder/memory.ts:28`). */
const OBSERVER_INSTRUCTION =
  'Escreva o título da conversa em português do Brasil, sobre o que a pessoa quer construir ou mudar no app.'
// The providers whose native search Mastra resolves (`webSearchTool`); Google through CLIProxy
// stays out until the live proof of criterion 3 passes.
const SEARCH_PROVIDERS = new Set(['anthropic', 'openai', 'xai'])
// `ask_user` and `submit_plan` are ours, under the native ids (`plan-tools.ts`); `subagent` stays off.
const BUILTIN_TOOLS: BuiltinToolId[] = ['ask_user', 'submit_plan', 'subagent']

function isRouterId(modelId: ModelId): modelId is ModelId & `${string}/${string}` {
  return modelId.includes('/')
}

/** The conversation's model, as its controller session holds it (`session.model.switch`). */
export function sessionModel(requestContext: RequestContext): ModelId & `${string}/${string}` {
  const modelId = chosenModel(requestContext)
  if (!isRouterId(modelId)) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'CONVERSATION_MODEL_NOT_ROUTED' },
    })
  }
  return modelId
}

/** `web_fetch` always; `web_search` only where Mastra resolves the provider's own search. */
export function toolsOf(modelId: ModelId): ToolsInput {
  const tools: ToolsInput = { web_fetch: webFetchTool }
  if (SEARCH_PROVIDERS.has(providerOf(modelId))) tools.web_search = webSearchTool
  return tools
}

/**
 * The Projeto's granted connections for a Mastra run, read once for its tools, its skills and its
 * instructions: Mastra resolves each of them with the run's `RequestContext`, and a resumed run
 * brings a new one, so a grant taken between two turns is gone in the next.
 */
function grantedFor(
  port: BuilderConnectors,
  projectOf: ReturnType<typeof projectIn>,
): (requestContext: RequestContext) => Promise<readonly GrantedConnection[]> {
  const read = new WeakMap<RequestContext, Promise<readonly GrantedConnection[]>>()
  return (requestContext) => {
    let granted = read.get(requestContext)
    if (granted === undefined) {
      granted = projectOf(requestContext).then((ids) =>
        ids === undefined ? [] : port.granted(ids),
      )
      read.set(requestContext, granted)
    }
    return granted
  }
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

/**
 * Each model call's budget (code C57): a provider that sends nothing for a minute, or holds one
 * call ten minutes, fails the call instead of holding the turn and the shutdown's drain.
 */
export const MODEL_TIMEOUT = { firstChunkMs: 60_000, stepMs: 600_000 }

/** The owner Mastra keeps a conversation under: the company with the person (criterion 8). */
export function memoryOwner(owner: { companyId: CompanyId; personId: PersonId }): string {
  return `company:${owner.companyId}:person:${owner.personId}`
}

/**
 * The Builder's memory: its title and its observation through the turn's account, failing soft,
 * in Mastra's own database, with Mastra Code's observer context and titles
 * (`agents/memory.ts:355-417`). Async buffering is off (`bufferTokens: false`, Mastra's documented
 * mode): with it on, each buffer cycle re-read the last 20 messages and each step re-read the
 * memory record, which held the buffered chunks: 340 to 510 MB per Builder hour by the egress
 * study's count, 480 MB/h as Neon measured it, and the free transfer ran out in days. Off, it
 * measured 7 to 9 times fewer bytes, at the cost of a pause while the Observer runs, about every
 * 30k tokens. The founder accepted that trade. Idle and provider-change activation and both
 * `bufferActivation` act only on buffered chunks, and `blockAfter` only applies with buffering;
 * Mastra clears them when it is off, so they went with it.
 */
export function conversationMemory(deps: {
  storage: PostgresStore
  queue: QueueDeps
  /** The title's instructions and the observer's, in the words of the conversation's kind. */
  title: string
  observer: string
  /** Whether the model may recall the messages the observation folded (Mastra's `recall` tool and its instructions). */
  recall: boolean
}): Memory {
  const { storage, queue } = deps
  const modelSettings = { timeout: MODEL_TIMEOUT }
  const failSoft = { modelSettings, maxRetries: 0, failurePolicy: 'continue' as const }
  const turnFor = sideTurn(queue)
  return new Memory({
    storage,
    options: {
      generateTitle: {
        model: accountModel(queue, 'title', turnFor),
        instructions: deps.title,
      },
      observationalMemory: {
        enabled: true,
        scope: 'thread',
        ...(deps.recall ? { retrieval: { scope: 'thread' } } : {}),
        temporalMarkers: true,
        observation: {
          ...failSoft,
          model: accountModel(queue, 'observer', turnFor),
          messageTokens: 30_000,
          bufferTokens: false,
          previousObserverTokens: 1000,
          threadTitle: true,
          instruction: deps.observer,
        },
        reflection: {
          ...failSoft,
          model: accountModel(queue, 'reflection', turnFor),
          observationTokens: 40_000,
        },
      },
    },
  })
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
  const modelSettings = { timeout: MODEL_TIMEOUT }
  const { queue } = deps
  const memory = conversationMemory({ storage, queue, ...BUILDER_MEMORY })
  const agent = createCodingAgent({
    id: BUILDER_ID,
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
    inputProcessors: [turnOf(deps), accountPick(deps.queue)],
    workspace: undefined,
    outputProcessors: [new CyberRefusalHandler(), workspaceMetadataLive],
    errorProcessors: accountErrorProcessors(deps.queue),
    maxRetries: 0,
    maxProcessorRetries: MAX_PROCESSOR_RETRIES,
    defaultOptions: {
      modelSettings,
      isTaskComplete: {
        scorers: [conexusCheck({ runs: deps.runs, storage })],
        strategy: 'all',
      },
    },
    memory,
  })
  const controller = new AgentController({
    id: BUILDER_ID,
    storage,
    memory,
    agent,
    modes: [{ id: CONVERSATION_MODE, availableTools: TOOL_CLOSURE.availableTools }],
    // The conversation's machine (Factory `session-sandbox.ts:29-36`); none outside a conversation.
    workspace: async ({ requestContext, mastra }) => {
      const ids = await projectOf(requestContext)
      return ids === undefined ? undefined : deps.runs.workspaceOf(ids, mastra)
    },
    disableBuiltinTools: BUILTIN_TOOLS,
    tools: { [ASK_USER_TOOL]: createAskUserTool(), [SUBMIT_PLAN_TOOL]: createSubmitPlanTool() },
    initialState: TOOL_CLOSURE.initialState,
  })
  return { controller, memory, agent, queue: deps.queue }
}

export type Builder = ReturnType<typeof createBuilder>
