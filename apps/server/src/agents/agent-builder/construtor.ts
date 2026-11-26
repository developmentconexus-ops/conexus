import { readFileSync } from 'node:fs'
import type { AutomationId, ProjectId } from '@conexus/hub-api'
import {
  CONSTRUTOR_TOOL,
  CONVERSATION_TOOL,
  DEVELOPMENT_HOSTS,
  MACHINE_TOOL,
  TASK_TOOLS,
} from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { Memory } from '@mastra/memory'
import type { FastifyInstance } from 'fastify'
import type {
  ConversationMachine,
  ConversationMachines,
  MachineTuning,
} from '../../harness/machine/public.ts'
import { createConversationMachines, machinePart } from '../../harness/machine/public.ts'
import type { HubPart } from '../../harness/mastra/public.ts'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { NetworkStore } from '../../harness/network/public.ts'
import { askingByRole, requestNetworkTool } from '../../harness/network/public.ts'
import { CONEXUS_PROMPT, TITLE } from '../../harness/prompt/public.ts'
import type { ConversationSpec, Owner, ReleaseScope, Speakers } from '../../harness/spec/public.ts'
import {
  ASK_USER_TOOL,
  blockOf,
  CONVERSATION_MODE,
  conversationMemory,
  createAskUserTool,
  mountAgent,
  oncePerRun,
  principalOf,
  releaseByMarks,
  sessionModel,
  takeOfScope,
  toolsOf,
  turnKeyOn,
} from '../../harness/spec/public.ts'
import type { CompanyToolDeps, ConnectorAccess } from '../../harness/tools/public.ts'
import {
  byPrincipal,
  companyConnections,
  companyToolScope,
  companyTools,
  TOOLS_OF,
} from '../../harness/tools/public.ts'
import type { Access, Place } from '../../hub/access/public.ts'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { liveProjectOf } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { AgentsAlive, InProject } from '../saved-agent/public.ts'
import { databaseScopeOf } from '../saved-agent/public.ts'
import { testDraft } from './draft-trial.ts'
import { registerConstrutorRoutes } from './routes.ts'
import type { RunOf } from './run.ts'
import { construtorAdmission, construtorRuns, inProjectOf, machineMarks } from './run.ts'
import { construtorTools } from './tools.ts'

const turnKey = turnKeyOn('conexus-construtor-turn-key')
const MODEL = { kind: 'SESSION', switched: 'CONSTRUTOR_MODEL_SET' } as const
const MANUAL = readFileSync(new URL('./prompt/construtor.md', import.meta.url), 'utf8').trim()

/**
 * The closed set the mode offers the model (criterion 22): the layer that enforces it. It holds of
 * the controller's own tools `ask_user` (a real question to the person, as a card) and the task
 * list, which the person follows the work by, and the request for a domain; none of these
 * publishes or writes in a company's system.
 */
const AVAILABLE_TOOLS: readonly string[] = [
  ...TOOLS_OF.construtor,
  CONVERSATION_TOOL.webFetch,
  CONVERSATION_TOOL.webSearch,
  ASK_USER_TOOL,
  ...Object.values(CONSTRUTOR_TOOL),
  MACHINE_TOOL.requestNetwork,
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
  network: NetworkStore
  log: FailureLog
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

/** The run's scope, its Projeto and its company tools' scope, read once per run; none is the conversation's absence. */
function runScopeOf(deps: Deps, scopeOf: RunOf) {
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
  return async (requestContext: RequestContext) => {
    const run = await scopeOf(requestContext)
    const scope = run === undefined ? undefined : inProjectOf(run)
    const toolScope = await toolScopeOf(requestContext)
    if (run === undefined || scope === undefined || toolScope === undefined) {
      throw new Failure('CONVERSATION_NOT_FOUND')
    }
    return { run, scope, toolScope }
  }
}

/**
 * The Construtor's ficha: Conexus's fixed message, the conversation's block and the manual; the
 * session's model; the Project's connector reads, the web and the Construtor's tools, all bound to
 * the run's scope; one mode with a closed list of tools and `ask_user` of its own.
 */
function construtorSpec(
  deps: Deps,
  parts: {
    memory: Memory
    scopeOf: RunOf
    machines: ConversationMachines
  },
): ConversationSpec {
  const { scopeOf } = parts
  const tools: CompanyToolDeps = {
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
  const runScope = runScopeOf(deps, scopeOf)
  async function block(requestContext: RequestContext) {
    const { run, toolScope } = await runScope(requestContext)
    const speakers = await deps.speakersOf(run)
    return blockOf(speakers, await companyConnections(toolScope))
  }
  return {
    kind: 'construtor',
    name: 'Construtor',
    prompt: {
      kind: 'MESSAGES',
      parts: [
        { kind: 'FIXED', text: CONEXUS_PROMPT },
        { kind: 'OF_RUN', of: block },
        { kind: 'TEXT', text: MANUAL },
      ],
    },
    model: MODEL,
    tools: async (requestContext) => {
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
    // Decision 0053: nothing waits to be approved; the tools only build a draft.
    approval: { kind: 'NOTHING_ASKS' },
    turn: {
      kind: 'SESSION',
      id: 'conexus-construtor-turn',
      take: takeOfScope({
        ...{ queue: deps.queue, turnKey },
        scopeOf: async (requestContext) => (await scopeOf(requestContext))?.owner,
      }),
    },
    threads: parts.memory,
    mode: { id: CONVERSATION_MODE, availableTools: AVAILABLE_TOOLS },
    own: {
      fixed: {
        [ASK_USER_TOOL]: createAskUserTool(),
        [MACHINE_TOOL.requestNetwork]: requestNetworkTool({
          store: deps.network,
          machines: parts.machines,
          asking: async (requestContext) =>
            askingByRole(deps, (await runScope(requestContext)).run),
        }),
      },
    },
  }
}

/**
 * The Construtor (step 24.3, U4): the third controller on the kit, one mode with a closed list of
 * tools, `yolo` (the draft without asking; nothing publishes). Its conversations are threads under
 * `construtor:company:<c>:person:<p>` marked with the Projeto; the Hub keeps no table of them. Its
 * turn takes the person's accounts as the Assistant's, with no Projeto's run. Its machine (step 24.4) is
 * the Hub's own, for the tool in code it writes and tests: the model gets none of the machine's tools
 * but the request for a domain.
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
      network: { kind: 'ON_REQUEST', hosts: DEVELOPMENT_HOSTS, opened: deps.network.opened },
      otherTemplate: 'replace',
      marks: machineMarks(scopeOf),
    },
    { ...deps.machine, log },
    deps.machineTuning,
  )
  const { each, ...wired } = machinePart(machines, deps.network)
  const { controller } = mountAgent(construtorSpec(deps, { memory, scopeOf, machines }), {
    queue,
    storage,
  })

  return Object.freeze({
    controller,
    memory,
    /** Its controller on the one `Mastra` (`harness/mastra/`), after the agents'. */
    part: {
      kind: 'construtor',
      controller,
      memory,
      model: MODEL,
      // Its tool that writes code starts the conversation's machine, as the Assistant's: the screen
      // hears it.
      ...wired,
      /** Whether the person may build agents in the company now (`manageAgents`). */
      admit: construtorAdmission(deps),
      async release(scope: ReleaseScope): Promise<void> {
        await releaseByMarks(
          { controller, memory, log },
          {
            kind: 'construtor',
            scope,
            code: 'CONSTRUTOR_CONVERSATIONS_RELEASED',
            each,
          },
        )
      },
    } satisfies HubPart,
    routes: (app: FastifyInstance) =>
      registerConstrutorRoutes(app, { ...deps, conversations: { controller, memory } }),
  } as const)
}
