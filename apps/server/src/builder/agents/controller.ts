import {
  AGENTS_CONTROLLER,
  AgentId as AgentIdSchema,
  ConversationId,
  ProjectId,
} from '@conexus/hub-api'
import { Agent } from '@mastra/core/agent'
import type { Mastra } from '@mastra/core/mastra'
import type { RequestContext } from '@mastra/core/request-context'
import { Memory } from '@mastra/memory'
import type { PostgresStore } from '@mastra/pg'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { databaseFailure } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Speakers } from '../assistant/public.ts'
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
} from '../controller-kit/public.ts'
import { conversationMemory, routedModel } from '../conversation/public.ts'
import type { ConversationMachine, ConversationMachines, MachineTuning } from '../machine/public.ts'
import { createConversationMachines, MARK, PACKAGE_HOSTS } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { AgentDeps, AgentRun } from './agent.ts'
import { agentOf, agentTurnOf, planOf, setAgentRun } from './agent.ts'
import type { AppDataPort } from './app-data.ts'
import type { CodeToolsDeps } from './code-tools.ts'
import type { AgentEvent, AgentEvents } from './events.ts'
import type { AgentReads, Registry } from './registry.ts'
import { createRegistry } from './registry.ts'
import { agent, agentConversation } from './tables.ts'
import { writeOfAgents } from './write-of.ts'

const MODE = 'conversa'
const TITLE =
  'Dê à conversa um título curto em português, de até seis palavras, sobre o que a pessoa pergunta ou pede, sem aspas nem ponto final.'
const OBSERVER =
  'Escreva o título da conversa em português do Brasil, sobre o que a pessoa pergunta, analisa ou pede.'

/**
 * The marks of an agent's thread, stamped by `createSession({ tags })`: its own keys, so the
 * Assistant's sweep by `companyId` never takes an agent's thread, nor this one an Assistant's.
 */
export const AGENT_MARK = {
  company: 'conexusAgentCompany',
  person: 'conexusAgentPerson',
  project: 'conexusAgentProject',
  agent: 'conexusAgent',
  draft: 'conexusAgentDraft',
} as const

const Controller = z.object({ resourceId: z.string(), sessionId: ConversationId })

/** Which agent a conversation of the owner's runs, and whether its draft, as the Hub keeps it. */
export async function keptRun(database: Database, owner: Owner, id: ConversationId) {
  const [row] = await database.read({ kind: 'COMPANY', ...owner }, (tx) =>
    tx
      .select({
        agentId: agentConversation.agentId,
        draft: agentConversation.draft,
        projectId: agent.projectId,
      })
      .from(agentConversation)
      .innerJoin(agent, eq(agent.id, agentConversation.agentId))
      .where(eq(agentConversation.id, id)),
  )
  if (row === undefined) return undefined
  const scope = { ...owner, projectId: ProjectId.parse(row.projectId) }
  const agentId = AgentIdSchema.parse(row.agentId)
  return { kind: row.draft ? 'DRAFT' : 'PUBLISHED', scope, agentId } satisfies AgentRun
}

/** The run a conversation of the agents' controller is: its owner by the thread, its agent by the Hub's row. */
function runsOf(database: Database) {
  return oncePerRun(async (requestContext): Promise<AgentRun | undefined> => {
    const controller = Controller.safeParse(requestContext.get('controller'))
    if (!controller.success) return undefined
    const owner = ownerOfResource(controller.data.resourceId)
    if (owner?.kind !== 'agents') return undefined
    const { companyId, personId } = owner
    return keptRun(database, { companyId, personId }, controller.data.sessionId)
  })
}

type Resolved = (requestContext: RequestContext) => Promise<Agent>

/**
 * The start of a turn with the published version, written on the agent's row (`last_run_at`, step
 * 24.3.1, U9). A write that fails does not stop the turn: the next one writes.
 */
async function markRun(database: Database, log: FailureLog, run: AgentRun): Promise<void> {
  const { companyId, personId } = run.scope
  try {
    await database.command({ kind: 'COMPANY', companyId, personId }, (tx) =>
      tx
        .update(agent)
        .set({ lastRunAt: sql`now()` })
        .where(and(eq(agent.companyId, companyId), eq(agent.id, run.agentId))),
    )
  } catch (error) {
    logFailure(
      log,
      databaseFailure(error),
      { companyId, agentId: run.agentId },
      'AGENT_LAST_RUN_NOT_WRITTEN',
    )
  }
}

/**
 * The turns of the agents' conversations, on the kit's owner of their end: a run takes its
 * person's turn with the model of the version it runs held.
 */
function agentTurns(
  queue: QueueDeps,
  runOf: ReturnType<typeof runsOf>,
  resolvedOf: Resolved,
  own: { database: Database; log: FailureLog; machines: ConversationMachines },
) {
  return sessionTurns({
    id: 'conexus-agents-turn',
    async take(requestContext) {
      const run = await runOf(requestContext)
      if (run === undefined) return undefined
      if (run.kind === 'PUBLISHED') await markRun(own.database, own.log, run)
      const { start } = await planOf(await resolvedOf(requestContext), requestContext)
      const model = { id: start.model, effort: start.effort }
      return agentTurnOf(queue, requestContext, { run, model })
    },
    ended: (sessionId) => void own.machines.stop(sessionId),
  })
}

/**
 * The marks of an agent conversation's machine (security S36): its company, Projeto and agent.
 * None outside an agent's conversation, and none when the version has no Computador, so listing
 * agents or talking to one without it starts and makes nothing.
 */
function machineMarks(runOf: ReturnType<typeof runsOf>, resolvedOf: Resolved) {
  return async (requestContext: RequestContext): Promise<Record<string, string> | undefined> => {
    const run = await runOf(requestContext)
    if (run === undefined) return undefined
    const { machine } = await planOf(await resolvedOf(requestContext), requestContext)
    if (!machine) return undefined
    return {
      [MARK.company]: run.scope.companyId,
      [MARK.project]: run.scope.projectId,
      [MARK.agent]: run.agentId,
    }
  }
}

/**
 * The controller's one agent, which delegates at each request to the agent the conversation names:
 * its instructions, tools and memory, read once per run, and the version's model; the registered
 * agent's own processors do not run here, the turn below takes their place.
 */
function delegatingAgent(
  queue: QueueDeps,
  resolvedOf: Resolved,
  turns: ReturnType<typeof sessionTurns>,
): Agent {
  return new Agent({
    id: AGENTS_CONTROLLER,
    name: 'Agents',
    instructions: async ({ requestContext }) =>
      (await resolvedOf(requestContext)).getInstructions({ requestContext }),
    model: async ({ requestContext }) =>
      routedModel((await planOf(await resolvedOf(requestContext), requestContext)).start.model),
    tools: async ({ requestContext }) =>
      (await resolvedOf(requestContext)).listTools({ requestContext }),
    memory: async ({ requestContext }) => {
      const chosen = await (await resolvedOf(requestContext)).getMemory({ requestContext })
      if (chosen === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_WITHOUT_MEMORY' } })
      }
      return chosen
    },
    ...agentDefaults(queue, turns),
  })
}

/** The draft's `Agent`, with no observational memory, which reads a thread a run alone has not. */
async function draftAgentOf(deps: Deps & { memories: AgentDeps['memories'] }, run: AgentRun) {
  const draft = await deps.agents.draftOf(run.scope, run.agentId)
  const alone = { ...draft, memory: { observational: false } }
  return agentOf(deps, { ...alone, ...run.scope, agentId: run.agentId })
}

type Deps = {
  storage: PostgresStore
  database: Database
  identity: IdentityPorts
  queue: QueueDeps
  connectors: Connectors['assistant']
  speakersOf: (scope: SessionScope) => Promise<Speakers>
  appData: AppDataPort
  agents: AgentReads & Pick<AgentEvents, 'onChange'>
  /** The conversations' machines at the provider; an agent with its Computador gets one (step 24.4, U4). */
  machine: ConversationMachine
  machineTuning?: MachineTuning
  /** The one `Mastra` the registry adds the agents to, made after the parts. */
  mastra: () => Mastra
  /** The saved tools' calls at the edge (step 24.4, U3). */
  codeTools: CodeToolsDeps
  log: FailureLog
}

/**
 * The agents' conversations (step 24.3, U2): the registry of every published agent, and the
 * controller "agentes" on the kit, whose one agent delegates, at each request, to the agent the
 * conversation names (the registered one, or the draft's): its instructions, tools and memory, and
 * the version's model for the turn. Its sessions are the 24.1 ones; its processors are its own
 * agent's, the turn by the session with the version's model held, then the account's pick.
 */
export function createAgentConversations(deps: Deps) {
  const { storage, database, queue, log } = deps
  const memory = conversationMemory({
    ...{ storage, queue, recall: false },
    title: TITLE,
    observer: OBSERVER,
  })
  const memories = { observational: memory, plain: new Memory({ storage }) }
  // The registry builds its agents with the machines, and the machines' marks read a run's plan
  // through the registry: each is used after both exist.
  const registry = createRegistry({
    ...deps.agents,
    ...{ mastra: deps.mastra, log },
    build: (live) => agentOf({ ...deps, memories, machines }, live),
  })
  const runOf = runsOf(database)
  const resolvedOf = oncePerRun(async (requestContext) => {
    const run = await runOf(requestContext)
    if (run === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
    setAgentRun(requestContext, run)
    return registry.resolve(run)
  })
  const machines = createConversationMachines(
    {
      ...{ ...deps.machine, log, hosts: PACKAGE_HOSTS },
      marksOf: machineMarks(runOf, resolvedOf),
    },
    deps.machineTuning,
  )
  const turns = agentTurns(queue, runOf, resolvedOf, { database, log, machines })
  // `yolo` off (step 24.5): a write asks by its own rule; no session rule, whose `allow` loses calls.
  // The mode lists no tools: the closed set is the version's, which only this code builds.
  const controller = controllerOf({
    ...{
      kind: 'agents',
      storage,
      memory,
      agent: delegatingAgent(queue, resolvedOf, turns),
    },
    mode: { id: MODE },
    // The conversation's machine, none for a version without its Computador (Factory `session-sandbox.ts:29-36`).
    workspace: ({ requestContext }) => machines.workspace(requestContext),
    initialState: { yolo: false },
  })
  turns.watch(controller)

  async function sweep(marks: Record<string, string>): Promise<number> {
    return releaseThreads({ controller, memory }, await threadsByMarks(memory, marks), (id) =>
      machines.kill(id),
    )
  }
  deps.agents.onChange((event) => followed(event, { registry, sweep, log }))

  return Object.freeze({
    registry,
    controller,
    memory,
    machines,
    draftAgent: (run: AgentRun) => draftAgentOf({ ...deps, memories }, run),
    /** Its controller on the one `Mastra` (`builder/mastra/`), after the Assistant's. */
    part: {
      kind: 'agents',
      controller,
      memory,
      /** Whether the person may talk to the Projeto's agents now (`manageAgents`). */
      admit: agentManagerAdmission({ database, identity: deps.identity }),
      writeOf: writeOfAgents((owner, id) => keptRun(database, owner, id), deps.agents),
      async release(scope: ReleaseScope): Promise<void> {
        const count = await sweep({
          [AGENT_MARK.company]: scope.companyId,
          ...(scope.personId === undefined ? {} : { [AGENT_MARK.person]: scope.personId }),
          ...(scope.projectId === undefined ? {} : { [AGENT_MARK.project]: scope.projectId }),
        })
        log.info({ companyId: scope.companyId, count }, 'AGENT_CONVERSATIONS_RELEASED')
      },
      /** Every published agent before the scheduler wakes, which drops what it cannot find. */
      async beforeWorkers(): Promise<void> {
        await registry.hydrate()
      },
      // Where its machine starts, which the turn's end tells (QA F1); the machines stop after the runs `drain` stopped.
      ends: { onPhase: machines.onPhase.bind(machines) },
      close: () => machines.stopAll(),
    },
  } as const)
}

/** What an agent's change does to the registry and to its conversations: a swap, or a removal and a sweep. */
async function followed(
  event: AgentEvent,
  own: {
    registry: Registry
    sweep: (marks: Record<string, string>) => Promise<number>
    log: FailureLog
  },
): Promise<void> {
  switch (event.kind) {
    case 'ACTIVATED':
      return own.registry.replace(event.agentId, event.companyId)
    case 'DELETED':
      await own.registry.remove(event.agentId)
      break
    case 'DELETING':
      break
    default:
      return event satisfies never
  }
  const count = await own.sweep({
    [AGENT_MARK.company]: event.companyId,
    [AGENT_MARK.agent]: event.agentId,
  })
  own.log.info(
    { companyId: event.companyId, agentId: event.agentId, count },
    'AGENT_CONVERSATIONS_SWEPT',
  )
}

export type AgentConversations = ReturnType<typeof createAgentConversations>
