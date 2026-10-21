import type { CompanyId, ModelId, PersonId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { BuiltinToolId } from '@mastra/core/agent-controller'
import { AgentController } from '@mastra/core/agent-controller'
import { Mastra } from '@mastra/core/mastra'
import type { RequestContext } from '@mastra/core/request-context'
import { webFetchTool, webSearchTool } from '@mastra/core/tools'
import { Memory } from '@mastra/memory'
import type { MastraPool } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
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
import { BuilderLogger } from './logger.ts'
import { createMastraStorage } from './storage.ts'

const BUILDER_ID = 'builder'
const CONVERSATION_MODE = 'conversa'

const INSTRUCTIONS = [
  'You are the Builder of Conexus: you help a person in a company think through the business app',
  'they want. Answer in Brazilian Portuguese. Search and read the web when it helps, and say which',
  'pages you read.',
].join(' ')
const TITLE_INSTRUCTIONS =
  'Dê à conversa um título curto em português, de até seis palavras, sem aspas nem ponto final.'
// The providers whose native search Mastra resolves (`webSearchTool`); Google through CLIProxy
// stays out until the live proof of criterion 3 passes.
const SEARCH_PROVIDERS = new Set(['anthropic', 'openai', 'xai'])
const BUILTIN_TOOLS: BuiltinToolId[] = [
  'ask_user',
  'submit_plan',
  'task_write',
  'task_update',
  'task_complete',
  'task_check',
  'subagent',
]

function isRouterId(modelId: ModelId): modelId is ModelId & `${string}/${string}` {
  return modelId.includes('/')
}

/** The conversation's model, as its controller session holds it (`session.model.switch`). */
function sessionModel(requestContext: RequestContext): ModelId & `${string}/${string}` {
  const modelId = chosenModel(requestContext)
  if (!isRouterId(modelId)) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'CONVERSATION_MODEL_NOT_ROUTED' },
    })
  }
  return modelId
}

/** `web_fetch` always; `web_search` only where Mastra resolves the provider's own search. */
function toolsOf(modelId: ModelId): ToolsInput {
  const tools: ToolsInput = { web_fetch: webFetchTool }
  if (SEARCH_PROVIDERS.has(providerOf(modelId))) tools.web_search = webSearchTool
  return tools
}

/**
 * Each model call's budget (code C57): a provider that sends nothing for a minute, or holds one
 * call ten minutes, fails the call instead of holding the turn and the shutdown's drain.
 */
const MODEL_TIMEOUT = { firstChunkMs: 60_000, stepMs: 600_000 }

/** The owner Mastra keeps a conversation under: the company with the person (criterion 8). */
export function memoryOwner(owner: { companyId: CompanyId; personId: PersonId }): string {
  return `company:${owner.companyId}:person:${owner.personId}`
}

/**
 * The Builder (decision 0050): one agent shared by every conversation, its keyless model taken
 * from the session and given its account by the queue's processors, its memory, its title and its
 * observation through the same account, in Mastra's own database.
 */
export function createBuilder(deps: {
  pool: MastraPool
  queue: QueueDeps
  runs: Runs
  log: FailureLog
}) {
  const storage = createMastraStorage(deps.pool)
  const modelSettings = { timeout: MODEL_TIMEOUT }
  const failSoft = { modelSettings, maxRetries: 0, failurePolicy: 'continue' as const }
  const memory = new Memory({
    storage,
    options: {
      generateTitle: { model: accountModel(deps.queue, 'title'), instructions: TITLE_INSTRUCTIONS },
      observationalMemory: {
        enabled: true,
        scope: 'thread',
        retrieval: true,
        activateOnProviderChange: true,
        temporalMarkers: true,
        observation: {
          ...failSoft,
          model: accountModel(deps.queue, 'observer'),
          messageTokens: 30_000,
          bufferTokens: 1 / 5,
          bufferActivation: 2000,
          blockAfter: 2,
        },
        reflection: {
          ...failSoft,
          model: accountModel(deps.queue, 'reflection'),
          observationTokens: 40_000,
          bufferActivation: 1 / 2,
          blockAfter: 1.1,
        },
      },
    },
  })
  const agent = new Agent({
    id: BUILDER_ID,
    name: 'Builder',
    instructions: INSTRUCTIONS,
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: ({ requestContext }) => toolsOf(sessionModel(requestContext)),
    inputProcessors: [accountPick(deps.queue)],
    errorProcessors: accountErrorProcessors(deps.queue),
    maxRetries: 0,
    maxProcessorRetries: MAX_PROCESSOR_RETRIES,
    defaultOptions: { modelSettings },
    memory,
  })
  const controller = new AgentController({
    id: BUILDER_ID,
    storage,
    memory,
    agent,
    modes: [{ id: CONVERSATION_MODE }],
    // The turn's run owns its workspace; a session made outside a turn has none.
    workspace: ({ requestContext }) => deps.runs.workspaceOf(requestContext),
    disableBuiltinTools: BUILTIN_TOOLS,
    // The Builder's tools only read, so they run without asking, as Mastra Code's sessions do: an
    // approval parks the run and resumes it, which under load can end the turn (decision 0053).
    initialState: { yolo: true },
  })
  const mastra = new Mastra({
    logger: new BuilderLogger(deps.log),
    storage,
    agentControllers: { [BUILDER_ID]: controller },
  })
  // Mastra 1.78.0 gives its logger to the store but not to the store's domains, which log their own
  // failures; each domain takes it by the same `__setLogger` (code C50). Revisit on an upgrade.
  for (const domain of Object.values(storage.stores)) domain?.__setLogger(mastra.getLogger())
  return { controller, memory, mastra }
}

export type Builder = ReturnType<typeof createBuilder>
