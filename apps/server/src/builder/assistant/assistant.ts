import { readFileSync } from 'node:fs'
import type { CompanyId, ConversationId, Person } from '@conexus/hub-api'
import {
  ASSISTANT_CONTROLLER,
  ASSISTANT_TOOL,
  BUILDER_TOOL,
  SKILL_TOOLS,
  SUBAGENT_TOOL,
  TASK_TOOLS,
  WORKSPACE_TOOL,
} from '@conexus/hub-api'
import { Agent } from '@mastra/core/agent'
import type { RequestContext } from '@mastra/core/request-context'
import { TaskSignalProvider } from '@mastra/core/signals'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { FastifyInstance } from 'fastify'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { TYPED_READ_NAMES } from '../connectors/public.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import {
  admitAsker,
  agentDefaults,
  controllerOf,
  MODEL_TIMEOUT,
  oncePerRun,
  sessionModel,
  toolsOf,
} from '../controller-kit/public.ts'
import { ASK_USER_TOOL, createAskUserTool, skillOf } from '../conversation/public.ts'
import type { ConversationMachine, ConversationMachines, MachineTuning } from '../machine/public.ts'
import { createConversationMachines, PACKAGE_HOSTS, showFileTool } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { subagentModel } from '../model-accounts/public.ts'
import type { OntologyDoor } from '../ontology/public.ts'
import { profileReadOnlyInRuns } from './automation-memory.ts'
import { chosenConnections } from './chosen.ts'
import { COMPANY_MEMORY_TOOLS, companyMemory, companyScopes } from './company-memory.ts'
import { assistantConnectorTools, readsFiles } from './connector-access.ts'
import type { Owner, ScopeOf } from './context.ts'
import { machineMarks, sessionScopes } from './context.ts'
import { machineUploads, READ_MEDIA } from './files.ts'
import type { HandOffDoors } from './handoff.ts'
import { registerHandOff } from './handoff.ts'
import type { Speakers } from './instructions.ts'
import { assistantInstructions } from './instructions.ts'
import { maysOf } from './mays.ts'
import { assistantMemory } from './memory.ts'
import type { OpenDeps } from './open.ts'
import { admitted, asked, automationRunFor, openConversation } from './open.ts'
import { overviewTool, projectsOf } from './overview.ts'
import type { AssistantProjects } from './ports.ts'
import { handOffOf, proposeTools } from './propose.ts'
import { proposeAutomationTool } from './propose-automation.ts'
import { proposeCompanyMemoryTool } from './propose-company-memory.ts'
import { releaseConversations } from './release.ts'
import { RESEARCH, researchOnly, researchReads } from './research.ts'
import { registerAssistantRoutes } from './routes.ts'
import { assistantTurns, turnEnd } from './turn.ts'
import { typedSearch } from './typed-search.ts'

type AssistantConnectors = Connectors['assistant']
type AssistantConnection = Awaited<ReturnType<AssistantConnectors['connections']>>[number]

const MODE = 'conversa'
/** The `ToolSearchProcessor`'s own tool, by the id Mastra gives it. */
const SEARCH_TOOLS = 'search_tools'
/** The memory's own tools, by the ids `@mastra/memory` gives them (`listTools`). */
const MEMORY_TOOLS = ['recall', 'updateWorkingMemory'] as const
/**
 * The closed set the mode offers the model (criterion 12): the layer that enforces it, as the
 * controller filters the agent's tools by it; the save is built only for who may manage connections.
 * The typed reads come only once a search loads them. Of the controller's own tools it holds
 * `ask_user` (a card, only what it cannot decide) and the task list; the plan card stays the
 * Builder's, as the Assistant approves no plan, and one subagent type, `pesquisar`
 * (`research.ts`), which only reads. The memory's hold the person's other conversations and what
 * the model keeps about them (`memory.ts`); the company's, what it keeps (`company-memory.ts`).
 */
const AVAILABLE_TOOLS: readonly string[] = [
  ...Object.values(WORKSPACE_TOOL),
  ...MEMORY_TOOLS,
  ...COMPANY_MEMORY_TOOLS,
  SEARCH_TOOLS,
  ...TYPED_READ_NAMES,
  BUILDER_TOOL.conceptPropose,
  BUILDER_TOOL.inventorySearch,
  ...Object.values(ASSISTANT_TOOL),
  BUILDER_TOOL.webFetch,
  BUILDER_TOOL.webSearch,
  ...SKILL_TOOLS,
  ASK_USER_TOOL,
  SUBAGENT_TOOL,
  ...TASK_TOOLS,
]

/** What Conexus does, read by the Assistant when the task asks (the `conexus` skill). */
const CONEXUS_SKILL = skillOf({
  directory: 'conexus',
  content: readFileSync(new URL('./skills/conexus/SKILL.md', import.meta.url), 'utf8'),
  references: {},
})

export type Assistant = ReturnType<typeof createAssistant>

type Deps = {
  storage: MastraCompositeStore
  database: Database
  identity: IdentityPorts
  connectors: AssistantConnectors
  ontology: OntologyDoor
  projects: AssistantProjects
  queue: QueueDeps
  /**
   * The conversations' machines at the provider (step 24.1, U3): the Builder's kit and API, its
   * template and installation.
   */
  machine: ConversationMachine
  machineTuning?: MachineTuning
  /** The Projects, the grants and the Builder a hand-off reaches, made after the Assistant (step 24.3.2). */
  handOffs: () => HandOffDoors
  log: FailureLog
}

function readerScope(scope: SessionScope) {
  return { kind: 'COMPANY', companyId: scope.companyId, personId: scope.personId } as const
}

/**
 * The company, the person with their role, job title and department, and the Projeto the
 * conversation lives in, for its block.
 */
export function speakersOf(
  deps: Pick<Deps, 'database' | 'identity'> & {
    projects: Pick<AssistantProjects, 'liveProjectOf'>
  },
  scope: SessionScope,
): Promise<Speakers> {
  return deps.database.read(readerScope(scope), async (tx) => {
    const admitted = await admitAsker(deps.identity, tx, scope)
    const { companyId } = scope
    const company = await deps.identity.companyNameOf(tx, { admitted, companyId })
    const person = await deps.identity.personNameOf(tx, scope.personId)
    const profile = await deps.identity.memberProfileOf(tx, { companyId, personId: scope.personId })
    const project =
      scope.place.kind === 'PROJECT'
        ? await deps.projects.liveProjectOf(tx, { companyId, projectId: scope.place.projectId })
        : undefined
    if (company === undefined || person === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROMPT_SPEAKER_GONE' } })
    }
    if (scope.place.kind === 'PROJECT' && project === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROMPT_PROJECT_GONE' } })
    }
    return { company, person, role: admitted.role, ...profile, projectName: project?.name }
  })
}

type Offered = (requestContext: RequestContext) => Promise<readonly AssistantConnection[]>
type ChosenOf = (requestContext: RequestContext) => Promise<AssistantConnection[]>

/**
 * What the run's place offers, each with whether the conversation chose it, read once per run (as
 * `scopeOf`).
 */
function offeredFor(deps: Deps, scopeOf: ScopeOf): Offered {
  return oncePerRun(async (requestContext) => {
    const scope = await scopeOf(requestContext)
    return scope === undefined ? [] : deps.connectors.connections(scope)
  })
}

/**
 * The agent (`template-agent-harness`, `agents/agent.ts:33-76`): its instructions, tools and skills
 * from the run's scope, the Builder's model of the session and the Builder's processors by name.
 */
function assistantAgent(
  deps: Deps,
  parts: {
    memory: ReturnType<typeof assistantMemory>
    company: ReturnType<typeof companyMemory>
    turns: ReturnType<typeof assistantTurns>
    machines: ConversationMachines
    scopeOf: ScopeOf
    offeredOf: Offered
    chosenOf: ChosenOf
    savedAt: ReturnType<typeof readsFiles>
  },
) {
  const { queue } = deps
  const { scopeOf, offeredOf, chosenOf, savedAt } = parts
  const overview = overviewTool({
    scopeOf,
    projectsOf: (scope) => projectsOf(deps, scope),
    connectionsOf: async (requestContext) =>
      (await offeredOf(requestContext)).map(({ connectionId, connector, name, chosen }) => ({
        connectionId,
        connector,
        name,
        chosen,
      })),
  })
  const showFile = showFileTool(parts.machines)
  const proposeMemory = proposeCompanyMemoryTool({ memory: parts.company, scopeOf })
  const proposals = proposeTools(parts.machines)
  const automationRun = automationRunFor(parts.memory)
  // The prompt's block and the tools read the speaker's role together, once per run.
  const speakersFor = oncePerRun(async (requestContext) => {
    const scope = await scopeOf(requestContext)
    return scope === undefined ? undefined : speakersOf(deps, scope)
  })
  const maysFor = maysOf(deps.identity, speakersFor, automationRun)
  const defaults = agentDefaults(queue, parts.turns)
  const assistantDefaults = {
    ...defaults,
    // The turn's processor first, then the search that loads the reads (before the account's pick,
    // which flattens them for CLIProxy's Google path); the person's files go to the machine last,
    // once the pick has chosen the model.
    inputProcessors: [
      parts.turns.processor,
      typedSearch(deps, { scopeOf, chosenOf, savedAt }),
      // Before the account's pick, which flattens the step's tools, so it flattens the closed one.
      researchOnly,
      profileReadOnlyInRuns(automationRun),
      ...defaults.inputProcessors.filter((each) => each !== parts.turns.processor),
      machineUploads({ log: deps.log }),
    ],
  }
  return new Agent({
    id: ASSISTANT_CONTROLLER,
    name: 'Assistant',
    instructions: assistantInstructions({ offeredOf, speakersOf: speakersFor, maysOf: maysFor }),
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: async ({ requestContext }) => {
      const scope = await scopeOf(requestContext)
      const chosen = await chosenOf(requestContext)
      const { byAutomation, automate, propose } = await maysFor(requestContext)
      return {
        ...toolsOf(sessionModel(requestContext)),
        [ASSISTANT_TOOL.overview]: overview,
        [ASSISTANT_TOOL.showFile]: showFile,
        [ASSISTANT_TOOL.proposeCompanyMemory]: proposeMemory,
        ...(automate ? { [ASSISTANT_TOOL.proposeAutomation]: proposeAutomationTool(chosen) } : {}),
        ...handOffOf(scope, proposals, byAutomation),
        ...(scope === undefined
          ? {}
          : assistantConnectorTools(deps, { scope, chosen, mayPropose: propose })),
      }
    },
    skills: async ({ requestContext }) => [
      CONEXUS_SKILL,
      ...(await chosenOf(requestContext)).map((each) =>
        skillOf({ directory: each.skill.name, ...each.skill }),
      ),
    ],
    ...assistantDefaults,
    signals: [new TaskSignalProvider()],
    memory: parts.memory,
    ...companyScopes({ memory: parts.company, scopeOf }),
  })
}

/**
 * The Assistant (step 24.1, U2, `H1`): one agent beside the Builder in the same `Mastra`, its own
 * controller, every conversation a thread under its owner (`resourceOf`) with its place in the
 * thread's marks and its choice in the Hub's table (`chosen.ts`). Its instructions, tools and
 * skills come from the run's scope; its turn takes the owner's accounts without a Projeto; its
 * processors and memory are the Builder's.
 */
export function createAssistant(deps: Deps) {
  const { storage, queue } = deps
  const memory = assistantMemory({ storage, queue })
  const company = companyMemory(storage)
  const chosen = chosenConnections(deps.database)
  const scopeOf = sessionScopes({ chosenOf: chosen.of })
  const machines = createConversationMachines(
    {
      ...deps.machine,
      log: deps.log,
      hosts: PACKAGE_HOSTS,
      otherTemplate: 'resume',
      marksOf: machineMarks(scopeOf),
      readMedia: READ_MEDIA,
    },
    deps.machineTuning,
  )
  const turns = assistantTurns({ queue, scopeOf, machines })
  const offeredOf = offeredFor(deps, scopeOf)
  async function chosenOf(requestContext: RequestContext) {
    return (await offeredOf(requestContext)).filter((each) => each.chosen)
  }
  const savedAt = readsFiles()
  const agent = assistantAgent(deps, {
    ...{ memory, company, turns, scopeOf, machines },
    ...{ offeredOf, chosenOf, savedAt },
  })
  const controller = controllerOf({
    ...{ kind: 'assistant', storage, memory, agent },
    mode: { id: MODE, availableTools: AVAILABLE_TOOLS },
    // The helper's `connector_read` is made for each run, closed on the conversation's scope: the
    // helper's own context cannot find the conversation (`research.ts`).
    tools: {
      fixed: { [ASK_USER_TOOL]: createAskUserTool() },
      perRun: researchReads(deps, { scopeOf, chosenOf, savedAt }),
    },
    subagents: { types: [RESEARCH], model: subagentModel(queue, MODEL_TIMEOUT.stepMs) },
    // The conversation's machine (Factory `session-sandbox.ts:29-36`); none outside a conversation.
    workspace: ({ requestContext }) => machines.workspace(requestContext),
    // Decision 0053: nothing waits to be approved; the systems get no write.
    initialState: { yolo: true },
  })
  turns.watch(controller)
  const opening: OpenDeps = { ...deps, controller, memory, chosen }

  return Object.freeze({
    /** Its controller on the one `Mastra` (`builder/mastra/`), beside the Builder's. */
    part: {
      kind: 'assistant',
      controller,
      memory,
      /** Whether the person may ask the Assistant in the company now (`askAssistant`). */
      async admit(input: { person: Person; companyId: CompanyId }): Promise<void> {
        const owner = { companyId: input.companyId, personId: input.person.id }
        await deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
          await admitAsker(deps.identity, tx, owner)
        })
      },
      release: (scope: ReleaseScope) =>
        releaseConversations({ controller, memory, machines, log: deps.log }, scope),
      // Its turn writes in no Projeto: its end saves only the failure it said, and tells where its
      // machine starts (QA F1), as the Builder's tells its steps.
      ends: { onPhase: machines.onPhase.bind(machines) },
      /** The machines, after the runs `drain` stopped, before Mastra stops. */
      close: () => machines.stopAll(),
    },
    /** Admits the person who may ask now, in the place; else `NOT_FOUND` (S10). */
    admit: (owner: Owner, place: SessionScope['place']) =>
      admitted(deps, owner, place, 'askAssistant'),
    /** Admits the person who may create automations now, in the place; else `NOT_FOUND` (S10). */
    admitAutomations: (owner: Owner, place: SessionScope['place']) =>
      admitted(deps, owner, place, 'manageAutomations'),
    /** Opens a conversation, or finds the one its id names (`open.ts`). */
    open: (input: Parameters<typeof openConversation>[1]) => openConversation(opening, input),
    /** How the session's next turn ends (`turn.ts`). */
    turnEnd: (session: Parameters<typeof turnEnd>[1]) => turnEnd(controller, session),
    /** Whether the conversation already holds a question (`open.ts`). */
    asked: (owner: Owner, conversationId: ConversationId) => asked(memory, owner, conversationId),
    routes: (app: FastifyInstance) => {
      registerAssistantRoutes(app, { ...deps, controller, memory, chosen, machines, company })
      registerHandOff(app, { ...deps, memory, chosen, doors: deps.handOffs })
    },
  } as const)
}
