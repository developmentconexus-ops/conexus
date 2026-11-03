import { readFileSync } from 'node:fs'
import type { AutomationId } from '@conexus/hub-api'
import {
  BUILDER_TOOL,
  CONSTRUTOR_CONTROLLER,
  CONSTRUTOR_TOOL,
  ConversationId,
  ProjectId,
} from '@conexus/hub-api'
import type { AgentInstructions } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { Memory } from '@mastra/memory'
import type { PostgresStore } from '@mastra/pg'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { liveProjectOf } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { AgentsAlive } from '../agents/public.ts'
import type { Speakers } from '../assistant/public.ts'
import { blockOf } from '../assistant/public.ts'
import type { ConnectorAccess } from '../connectors/public.ts'
import { connectorTools } from '../connectors/public.ts'
import type { Owner, ReleaseScope } from '../controller-kit/public.ts'
import {
  agentDefaults,
  agentManagerAdmission,
  controllerOf,
  oncePerRun,
  ownerOfResource,
  releaseThreads,
  sessionTurns,
  threadsByMarks,
  turnKeyOn,
} from '../controller-kit/public.ts'
import {
  ASK_USER_TOOL,
  conversationMemory,
  createAskUserTool,
  sessionModel,
  toolsOf,
  turnOfOwner,
} from '../conversation/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { setTurn } from '../model-accounts/public.ts'
import type { InProject } from '../tools/public.ts'
import { databaseScopeOf, sessionScopeOf } from '../tools/public.ts'
import { CONSTRUTOR_MARK } from './open.ts'
import { registerConstrutorRoutes } from './routes.ts'
import { testDraft } from './test-draft.ts'
import { construtorTools } from './tools.ts'

const MODE = 'conversa'
const turnKey = turnKeyOn('conexus-construtor-turn-key')
const TITLE =
  'Dê à conversa um título curto em português, de até seis palavras, sobre o agente que a pessoa quer montar, sem aspas nem ponto final.'
const OBSERVER =
  'Escreva o título da conversa em português do Brasil, sobre o agente que a pessoa quer montar ou mudar.'

/** Conexus's fixed message, the same bytes as the Assistant's first part (step 24.1). */
const FIXED = readFileSync(
  new URL('../conversation/prompt/conexus.md', import.meta.url),
  'utf8',
).trim()
const MANUAL = readFileSync(new URL('./prompt/construtor.md', import.meta.url), 'utf8').trim()
const CACHED = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } } } as const

/**
 * The closed set the mode offers the model (criterion 22): the layer that enforces it. It holds
 * of the controller's own tools only `ask_user` (the ideas it proposes as a question card), and none
 * of these publishes or writes in a company's system.
 */
const AVAILABLE_TOOLS: readonly string[] = [
  BUILDER_TOOL.connectorRead,
  BUILDER_TOOL.connectorNotes,
  BUILDER_TOOL.webFetch,
  BUILDER_TOOL.webSearch,
  ASK_USER_TOOL,
  ...Object.values(CONSTRUTOR_TOOL),
]

const Controller = z.object({ resourceId: z.string(), sessionId: ConversationId })

type Deps = {
  storage: PostgresStore
  database: Database
  identity: IdentityPorts
  queue: QueueDeps
  connectors: Connectors['assistant']
  speakersOf: (scope: SessionScope) => Promise<Speakers>
  liveProjectOf: typeof liveProjectOf
  agents: Pick<AgentsAlive, 'service' | 'tools' | 'draftAgent'>
  /** The Projeto's automations (step 24.2): made after the one `Mastra`, so reached when called. */
  automations: () => {
    list(
      owner: Owner,
      projectId: ProjectId,
    ): Promise<{ id: AutomationId; name: string; prompt: string }[]>
  }
  /** The app's tables of a Projeto, names and columns, never a row (step 24.3, U3's door). */
  appTables: (scope: InProject) => Promise<{ name: string; columns: string[] }[] | null>
  log: FailureLog
}

type Threads = Pick<Memory, 'getThreadById'>

/** The person and the Projeto a run is of: the owner from the thread's resource, the Projeto from its marks. */
function scopes(memory: Threads) {
  return oncePerRun(async (requestContext): Promise<InProject | undefined> => {
    const controller = Controller.safeParse(requestContext.get('controller'))
    if (!controller.success) return undefined
    const owner = ownerOfResource(controller.data.resourceId)
    if (owner?.kind !== 'construtor') return undefined
    const thread = await memory.getThreadById({
      threadId: controller.data.sessionId,
      resourceId: controller.data.resourceId,
    })
    const projectId = ProjectId.safeParse(thread?.metadata?.[CONSTRUTOR_MARK.project])
    if (!projectId.success) return undefined
    return { companyId: owner.companyId, personId: owner.personId, projectId: projectId.data }
  })
}

/** What the Construtor's tools read of the Projeto: its name, what it received and its app's tables. */
function projectReader(deps: Deps) {
  return async (scope: InProject) => {
    const live = await deps.database.read(databaseScopeOf(scope), (tx) =>
      deps.liveProjectOf(tx, { companyId: scope.companyId, projectId: scope.projectId }),
    )
    if (live === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'PROJECT' } })
    const tables = await deps.appTables(scope)
    return {
      project: { id: scope.projectId, name: live.name },
      offered: await deps.connectors.connections(sessionScopeOf(scope)),
      app: tables === null ? null : { tables },
    }
  }
}

/**
 * The agent: Conexus's fixed message, the conversation's block and the manual; the session's model;
 * the Project's connector reads, the web and the Construtor's tools, all bound to the run's scope.
 */
function construtorAgent(
  deps: Deps,
  parts: { memory: Memory; turn: InputProcessor; scopeOf: ReturnType<typeof scopes> },
) {
  const { scopeOf } = parts
  const offeredOf = oncePerRun(async (requestContext) => {
    const scope = await scopeOf(requestContext)
    return scope === undefined ? [] : deps.connectors.connections(sessionScopeOf(scope))
  })
  const construtor = {
    agents: deps.agents.service,
    tools: deps.agents.tools,
    log: deps.log,
    test: testDraft({ ...deps.agents, agents: deps.agents.service, log: deps.log }),
    automations: (scope: InProject) =>
      deps
        .automations()
        .list({ companyId: scope.companyId, personId: scope.personId }, scope.projectId),
    project: projectReader(deps),
  }
  async function runScope(requestContext: RequestContext): Promise<InProject> {
    const scope = await scopeOf(requestContext)
    if (scope === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
    return scope
  }
  return new Agent({
    id: CONSTRUTOR_CONTROLLER,
    name: 'Construtor',
    instructions: async ({ requestContext }) => {
      const scope = await runScope(requestContext)
      const speakers = await deps.speakersOf(sessionScopeOf(scope))
      return [
        { role: 'system', content: FIXED, providerOptions: CACHED },
        { role: 'system', content: blockOf(speakers, await offeredOf(requestContext)) },
        { role: 'system', content: MANUAL },
      ] satisfies AgentInstructions
    },
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: async ({ requestContext }) => {
      const scope = await runScope(requestContext)
      const offered = await offeredOf(requestContext)
      const door: SessionScope = {
        ...sessionScopeOf(scope),
        chosen: offered.map((each) => each.connectionId),
      }
      const access: ConnectorAccess = {
        connections: offered,
        log: deps.log,
        read: (call, context) => deps.connectors.read(door, { ...call, turn: turnKey.of(context) }),
        notes: (connectionId) => deps.connectors.notes(door, connectionId),
        wording: { whose: 'this Project received', limit: '50 connector calls per answer' },
      }
      return {
        ...toolsOf(sessionModel(requestContext)),
        ...connectorTools(access, { noteSave: false }),
        ...construtorTools(construtor, scope),
      }
    },
    ...agentDefaults(deps.queue, parts.turn),
    memory: parts.memory,
  })
}

/**
 * The Construtor (step 24.3, U4): the third controller on the kit, one mode with a closed list of
 * tools, `yolo` (the draft without asking; nothing publishes). Its conversations are threads under
 * `construtor:company:<c>:person:<p>` marked with the Projeto; the Hub keeps no table of them. Its
 * turn takes the person's accounts as the Assistant's, with no machine and no Projeto's run.
 */
export function createConstrutor(deps: Deps) {
  const { storage, database, queue, log } = deps
  const memory = conversationMemory({
    ...{ storage, queue, recall: false },
    title: TITLE,
    observer: OBSERVER,
  })
  const scopeOf = scopes(memory)
  const turns = sessionTurns({
    id: 'conexus-construtor-turn',
    async take(requestContext) {
      const scope = await scopeOf(requestContext)
      if (scope === undefined) return undefined
      const turn = await turnOfOwner(queue, scope)
      setTurn(requestContext, turn)
      turnKey.start(requestContext)
      return turn
    },
  })
  const agent = construtorAgent(deps, { memory, turn: turns.processor, scopeOf })
  // Decision 0053: nothing waits to be approved; the tools only build a draft.
  const controller = controllerOf({
    ...{ kind: 'construtor', storage, memory, agent },
    mode: { id: MODE, availableTools: AVAILABLE_TOOLS },
    tools: { [ASK_USER_TOOL]: createAskUserTool() },
    initialState: { yolo: true },
  })
  turns.watch(controller)

  return Object.freeze({
    controller,
    memory,
    /** Its controller on the one `Mastra` (`builder/mastra/`), after the agents'. */
    part: {
      kind: 'construtor',
      controller,
      memory,
      /** Whether the person may build agents in the company now (`manageAgents`). */
      admit: agentManagerAdmission({ database, identity: deps.identity }),
      async release(scope: ReleaseScope): Promise<void> {
        const ids = await threadsByMarks(memory, {
          [CONSTRUTOR_MARK.company]: scope.companyId,
          ...(scope.personId === undefined ? {} : { [CONSTRUTOR_MARK.person]: scope.personId }),
          ...(scope.projectId === undefined ? {} : { [CONSTRUTOR_MARK.project]: scope.projectId }),
        })
        const count = await releaseThreads({ controller, memory }, ids)
        log.info({ companyId: scope.companyId, count }, 'CONSTRUTOR_CONVERSATIONS_RELEASED')
      },
    },
    routes: (app: FastifyInstance) =>
      registerConstrutorRoutes(app, { ...deps, conversations: { controller, memory } }),
  } as const)
}
