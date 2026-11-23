import { readFileSync } from 'node:fs'
import type { AutomationId, ProjectId } from '@conexus/hub-api'
import { BUILDER_TOOL, CONSTRUTOR_CONTROLLER, CONSTRUTOR_TOOL, TASK_TOOLS } from '@conexus/hub-api'
import type { AgentInstructions } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { Memory } from '@mastra/memory'
import type { FastifyInstance } from 'fastify'
import type { Access, Place } from '../../hub/access/public.ts'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { liveProjectOf } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { AgentsAlive } from '../agents/public.ts'
import type { CompanyToolDeps } from '../company-tools/public.ts'
import {
  byPrincipal,
  companyConnections,
  companyToolScope,
  companyTools,
} from '../company-tools/public.ts'
import type { ConnectorAccess } from '../connectors/public.ts'
import type { Owner, ReleaseScope, RunMark, RunScope, Speakers } from '../controller-kit/public.ts'
import {
  ASK_USER_TOOL,
  agentDefaults,
  agentManagerAdmission,
  blockOf,
  CONEXUS_PROMPT,
  CONVERSATION_MODE,
  controllerOf,
  conversationMemory,
  createAskUserTool,
  fixedSystem,
  oncePerRun,
  principalOf,
  releaseByMarks,
  runResolver,
  sessionModel,
  sessionTurns,
  TITLE,
  takeOfScope,
  toolsOf,
  turnKeyOn,
} from '../controller-kit/public.ts'
import type { ConversationMachine, ConversationMachines, MachineTuning } from '../machine/public.ts'
import { ALLOWED_HOSTS, createConversationMachines, MARK } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InProject } from '../tools/public.ts'
import { databaseScopeOf } from '../tools/public.ts'
import { testDraft } from './draft-trial.ts'
import { registerConstrutorRoutes } from './routes.ts'
import { construtorTools } from './tools.ts'

const turnKey = turnKeyOn('conexus-construtor-turn-key')
const MANUAL = readFileSync(new URL('./prompt/construtor.md', import.meta.url), 'utf8').trim()

/**
 * The closed set the mode offers the model (criterion 22): the layer that enforces it. It holds of
 * the controller's own tools `ask_user` (a real question to the person, as a card) and the task
 * list, which the person follows the work by; none of these publishes or writes in a company's
 * system.
 */
const AVAILABLE_TOOLS: readonly string[] = [
  BUILDER_TOOL.connectorRead,
  BUILDER_TOOL.connectorNotes,
  BUILDER_TOOL.webFetch,
  BUILDER_TOOL.webSearch,
  ASK_USER_TOOL,
  ...Object.values(CONSTRUTOR_TOOL),
  ...TASK_TOOLS,
]

type ConstrutorConnection = Awaited<ReturnType<Connectors['assistant']['connections']>>[number]

type Deps = {
  storage: MastraCompositeStore
  database: Database
  identity: IdentityPorts
  queue: QueueDeps
  connectors: Connectors['assistant']
  /** The access door: what the Projeto offers the person, which every company tool names. */
  access: Pick<Access, 'viewOf'>
  speakersOf: (scope: Readonly<{ owner: Owner; place: Place }>) => Promise<Speakers>
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
  /** The machine's provider (the Assistant's kit and API) and the tests' folder and toolchain; E2B's when absent. */
  machine: ConversationMachine
  machineTuning?: MachineTuning
  log: FailureLog
}

type RunOf = (requestContext: RequestContext) => Promise<RunScope | undefined>

/** Whether the Projeto a thread is marked with is a live one of the owner's company. */
async function liveIn(deps: Deps, owner: Owner, projectId: ProjectId): Promise<boolean> {
  const live = await deps.database.read({ kind: 'COMPANY', ...owner }, (tx) =>
    deps.liveProjectOf(tx, { companyId: owner.companyId, projectId }),
  )
  return live !== undefined
}

/** The guard's admission: the person builds agents now, in a Projeto of the company (criterion 21). */
function construtorAdmission(deps: Deps) {
  const manager = agentManagerAdmission({ database: deps.database, identity: deps.identity })
  return async (input: Parameters<typeof manager>[0] & { mark: RunMark }): Promise<void> => {
    await manager(input)
    const owner = { companyId: input.companyId, personId: input.person.id }
    const { projectId } = input.mark
    if (projectId === undefined || !(await liveIn(deps, owner, projectId))) {
      throw new Failure('CONVERSATION_NOT_FOUND')
    }
  }
}

/**
 * The Construtor's run: the Hub keeps no row of it, so its Projeto is its thread's mark, checked
 * against the company's live Projetos (Factory `tools/scope.ts:107`); every connection it received.
 */
function construtorRuns(deps: Deps, memory: Pick<Memory, 'getThreadById'>): RunOf {
  return runResolver('construtor', {
    memory,
    stored: async ({ owner, mark }) => {
      const { projectId } = mark
      if (projectId === undefined || !(await liveIn(deps, owner, projectId))) return undefined
      return {
        place: { kind: 'PROJECT', projectId },
        choice: { kind: 'ANY' },
        ceiling: { kind: 'PERSON' },
        attended: true,
      }
    },
  })
}

/** The person and the Projeto of the run, as the Construtor's tools act on them. */
function inProjectOf(run: RunScope): InProject | undefined {
  if (run.place.kind !== 'PROJECT') return undefined
  return { ...run.owner, projectId: run.place.projectId }
}

/** The marks of the conversation's machine: its company and its Projeto (security S36). */
function machineMarks(runOf: RunOf) {
  return async (requestContext: RequestContext) => {
    const run = await runOf(requestContext)
    const scope = run === undefined ? undefined : inProjectOf(run)
    if (scope === undefined) return undefined
    return { [MARK.company]: scope.companyId, [MARK.project]: scope.projectId }
  }
}

/** What the Construtor's tools read of the Projeto: its name, what it received in the run's view and its app's tables. */
function projectReader(deps: Deps, offered: () => Promise<readonly ConstrutorConnection[]>) {
  return async (scope: InProject) => {
    const live = await deps.database.read(databaseScopeOf(scope), (tx) =>
      deps.liveProjectOf(tx, { companyId: scope.companyId, projectId: scope.projectId }),
    )
    if (live === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'PROJECT' } })
    const tables = await deps.appTables(scope)
    return {
      project: { id: scope.projectId, name: live.name },
      offered: await offered(),
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
  parts: {
    memory: Memory
    turns: ReturnType<typeof sessionTurns>
    scopeOf: RunOf
    machines: ConversationMachines
  },
) {
  const { scopeOf } = parts
  const tools: CompanyToolDeps<ConstrutorConnection> = {
    log: deps.log,
    connector: byPrincipal(deps.connectors, turnKey.of),
  }
  const construtor = {
    machines: parts.machines,
    agents: deps.agents.service,
    tools: deps.agents.tools,
    log: deps.log,
    test: testDraft({ ...deps.agents, agents: deps.agents.service, log: deps.log }),
    automations: (scope: InProject) =>
      deps
        .automations()
        .list({ companyId: scope.companyId, personId: scope.personId }, scope.projectId),
  }
  const toolScopeOf = oncePerRun(async (requestContext: RequestContext) => {
    const run = await scopeOf(requestContext)
    if (run === undefined) return undefined
    return companyToolScope(
      run,
      {
        access: deps.access,
        connections: (each) => deps.connectors.connections(principalOf(each)),
      },
      { noteSave: false, appData: { kind: 'NONE' } },
    )
  })
  async function runScope(requestContext: RequestContext) {
    const run = await scopeOf(requestContext)
    const scope = run === undefined ? undefined : inProjectOf(run)
    const toolScope = await toolScopeOf(requestContext)
    if (run === undefined || scope === undefined || toolScope === undefined) {
      throw new Failure('CONVERSATION_NOT_FOUND')
    }
    return { run, scope, toolScope }
  }
  return new Agent({
    id: CONSTRUTOR_CONTROLLER,
    name: 'Construtor',
    instructions: async ({ requestContext }) => {
      const { run, toolScope } = await runScope(requestContext)
      const speakers = await deps.speakersOf(run)
      return [
        fixedSystem(CONEXUS_PROMPT),
        { role: 'system', content: blockOf(speakers, await companyConnections(toolScope)) },
        { role: 'system', content: MANUAL },
      ] satisfies AgentInstructions
    },
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: async ({ requestContext }) => {
      const { run, scope, toolScope } = await runScope(requestContext)
      function read(
        call: Parameters<ConnectorAccess['read']>[0],
        context: Parameters<ConnectorAccess['read']>[1],
      ) {
        return deps.connectors.read(principalOf(run), { ...call, turn: turnKey.of(context) })
      }
      const project = projectReader(deps, () => companyConnections(toolScope))
      return {
        ...toolsOf(sessionModel(requestContext)),
        ...(await companyTools(toolScope, 'construtor', tools)),
        ...construtorTools({ ...construtor, project, read }, scope),
      }
    },
    ...agentDefaults(deps.queue, parts.turns),
    memory: parts.memory,
  })
}

/**
 * The Construtor (step 24.3, U4): the third controller on the kit, one mode with a closed list of
 * tools, `yolo` (the draft without asking; nothing publishes). Its conversations are threads under
 * `construtor:company:<c>:person:<p>` marked with the Projeto; the Hub keeps no table of them. Its
 * turn takes the person's accounts as the Assistant's, with no Projeto's run. Its machine (step 24.4) is
 * the Hub's own, for the tool in code it writes and tests: the model gets none of the machine's tools.
 */
export function createConstrutor(deps: Deps) {
  const { storage, queue, log } = deps
  const memory = conversationMemory({
    ...{ storage, queue, recall: false },
    ...TITLE.agent,
  })
  const scopeOf = construtorRuns(deps, memory)
  const machines = createConversationMachines(
    {
      ...deps.machine,
      log,
      hosts: ALLOWED_HOSTS,
      otherTemplate: 'replace',
      marksOf: machineMarks(scopeOf),
    },
    deps.machineTuning,
  )
  const turns = sessionTurns({
    id: 'conexus-construtor-turn',
    take: takeOfScope({
      ...{ queue, turnKey },
      scopeOf: async (requestContext) => (await scopeOf(requestContext))?.owner,
    }),
  })
  const agent = construtorAgent(deps, { memory, turns, scopeOf, machines })
  // Decision 0053: nothing waits to be approved; the tools only build a draft.
  const controller = controllerOf({
    ...{ kind: 'construtor', storage, memory, agent },
    mode: { id: CONVERSATION_MODE, availableTools: AVAILABLE_TOOLS },
    tools: { fixed: { [ASK_USER_TOOL]: createAskUserTool() } },
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
      // Its tool that writes code starts the conversation's machine, as the Assistant's: the screen hears it.
      ends: { onPhase: machines.onPhase.bind(machines) },
      /** The machines, after the runs `drain` stopped, before Mastra stops. */
      close: () => machines.stopAll(),
      /** Whether the person may build agents in the company now (`manageAgents`). */
      admit: construtorAdmission(deps),
      async release(scope: ReleaseScope): Promise<void> {
        await releaseByMarks(
          { controller, memory, log },
          {
            kind: 'construtor',
            scope,
            code: 'CONSTRUTOR_CONVERSATIONS_RELEASED',
            each: (id) => machines.kill(id),
          },
        )
      },
    },
    routes: (app: FastifyInstance) =>
      registerConstrutorRoutes(app, { ...deps, conversations: { controller, memory } }),
  } as const)
}
