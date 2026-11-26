import type {
  AgentId as AgentIdType,
  CompanyData,
  ConnectionId,
  Effort,
  ModelId,
  OfProject,
} from '@conexus/hub-api'
import { AgentId, CompanyId, MACHINE_TOOL, PersonId, ProjectId } from '@conexus/hub-api'
import type { Agent, ToolsInput } from '@mastra/core/agent'
import type { MastraMemory } from '@mastra/core/memory'
import { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { ConversationMachines } from '../../harness/machine/public.ts'
import { conversationRun } from '../../harness/memory/public.ts'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import {
  AccountTurn,
  conversationStart,
  memoryModelsFor,
} from '../../harness/model-accounts/public.ts'
import type { NetworkStore } from '../../harness/network/public.ts'
import { CONEXUS_PROMPT } from '../../harness/prompt/public.ts'
import type { DataBinding, Owner, RunScope, Speakers, Stored } from '../../harness/spec/public.ts'
import {
  agentOfSpec,
  blockOf,
  oncePerRun,
  principalOf,
  routedModel,
  toolsOf,
  turnKeyOn,
} from '../../harness/spec/public.ts'
import type { AppDataPort, CompanyToolScope } from '../../harness/tools/public.ts'
import { companyConnections, dataOrder } from '../../harness/tools/public.ts'
import type { Access, Place, Principal } from '../../hub/access/public.ts'
import { principalFor } from '../../hub/access/public.ts'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { codeModeOf } from './code-mode.ts'
import type { CodeToolsDeps } from './code-tools.ts'
import { codeTools } from './code-tools.ts'
import { agentToolScope, agentTools } from './company.ts'
import type { FrozenTool, FrozenVersion } from './frozen.ts'
import { declaredOf } from './frozen.ts'
import { legacyTools } from './legacy.ts'
import { machineTools } from './machine-tools.ts'
import type { WriteAuthor } from './tools.ts'
import { presetTools } from './tools.ts'

const READ_ONLY =
  'You only read: no tool of yours writes in a system. When the person asks you to change, save or send something, say that you cannot and what they can do instead.'
const WRITES =
  'Some of your tools write in a system, and only those do. A write may wait for the person to approve it here: when it is declined, do not call it again in the same answer and say that nothing was written. When a write answers that it must not be called again, do not, and tell the person what it says.'
const RUN = 'conexus-agent-run'
const turnKey = turnKeyOn('conexus-agent-turn-key')

const AgentRunSchema = z.object({
  kind: z.enum(['PUBLISHED', 'DRAFT']),
  scope: z.object({ companyId: CompanyId, projectId: ProjectId, personId: PersonId }),
  agentId: AgentId,
})
/** What the conversation runs, in the `requestContext` (C21): the published agent, or its draft. */
export type AgentRun = z.infer<typeof AgentRunSchema>

/** The key and the id in Mastra: never `builder`, `assistant`, `agents` nor `construtor`. */
export function agentKey(id: AgentIdType): `agent-${string}` {
  return `agent-${id}`
}

/** The run a request context carries, or none. */
export function agentRunIn(requestContext: RequestContext): AgentRun | undefined {
  return AgentRunSchema.safeParse(requestContext.get(RUN)).data
}

export function setAgentRun(requestContext: RequestContext, run: AgentRun): void {
  requestContext.set(RUN, run)
}

/** A request context with only the run: how a workflow, a test or the Construtor calls an agent alone. */
export function agentRunContext(run: AgentRun): RequestContext {
  const context = new RequestContext()
  setAgentRun(context, run)
  return context
}

/**
 * The turn of the run's person in the accounts' queue, with the agent's model held for the whole
 * turn (`AccountTurn`'s fixed model), and a new key for the door on the run's context. The turn itself is
 * put on the context by the caller (the controller's turns do it as they take).
 */
export async function agentTurnOf(
  queue: QueueDeps,
  requestContext: RequestContext,
  input: { run: AgentRun; model: { id: ModelId; effort: Effort } },
): Promise<AccountTurn> {
  const { companyId, personId } = input.run.scope
  const owner = { companyId, personId }
  const memoryModels = await memoryModelsFor(queue, owner)
  const turn = new AccountTurn({ ...owner, memoryModels, model: input.model })
  turnKey.start(requestContext)
  return turn
}

export type AgentDeps = {
  database: Database
  identity: Pick<IdentityPorts, 'allows' | 'mayUse' | 'mayPublishUnattended'>
  queue: QueueDeps
  connectors: Connectors['assistant']
  appData: AppDataPort
  /** The company's data, bound to the run's scope, and to the conversation and the agent that read. */
  companyData: (principal: Principal, context: DataBinding) => CompanyData
  /** The access door: what the run reaches, which every company tool names. */
  access: Pick<Access, 'viewOf'>
  speakersOf: (scope: Readonly<{ owner: Owner; place: Place }>) => Promise<Speakers>
  /** The 24.1 memory with the observational one, and one without it, each made once. */
  memories: { observational: MastraMemory; plain: MastraMemory }
  /**
   * The conversations' machines, which the agents' controller owns (step 24.4, U4); an agent that
   * runs alone (the Construtor's test of the draft) gets none.
   */
  machines?: Pick<ConversationMachines, 'folder' | 'serving' | 'codeMode' | 'reopen'>
  /** The domains the machines reach beyond the development list, which a run asks for. */
  network: Pick<NetworkStore, 'opened' | 'grant'>
  /** The saved tools' calls at the edge (step 24.4, U3). */
  codeTools: CodeToolsDeps
  log: FailureLog
}

/** What a run reads of its version once, and what the run keeps of it: its connections and what it declares. */
type VersionRead = Readonly<{
  run: AgentRun
  owner: Owner
  /** The version's tools: the chosen ones, or for a version written before E4 the kit's reads of its connections. */
  tools: readonly FrozenTool[]
  /** The connections the version selected: the notebook of each, and the home of every tool. */
  selected: ReadonlySet<ConnectionId>
  stored: Stored
}>

/** What a run of the agent reads once: its person's start of the model, the scope and what it still offers. */
export type Plan = VersionRead & {
  start: { model: ModelId; effort: Effort }
  runScope: RunScope
  scope: Principal
  offered: Awaited<ReturnType<Connectors['assistant']['connections']>>
  /** The run's company tools' scope: its view of what the version declares. */
  toolScope: CompanyToolScope<Plan['offered'][number]>
  /** Whether the version has its Computador: the conversation's machine and its tools. */
  machine: boolean
}

type Read<T> = (requestContext: RequestContext) => Promise<T>
const made = new WeakMap<Agent, Readonly<{ plan: Read<Plan>; version: Read<VersionRead> }>>()

function madeOf(agent: Agent) {
  const found = made.get(agent)
  if (found !== undefined) return found
  throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_WITHOUT_PLAN' } })
}

/** What the run of an agent `agentOf` made keeps: the version's connections and what it declares. */
export async function storedOf(agent: Agent, requestContext: RequestContext): Promise<Stored> {
  return (await madeOf(agent).version(requestContext)).stored
}

/** The plan of a run of an agent `agentOf` made, which the agents' controller takes its turn by. */
export function planOf(agent: Agent, requestContext: RequestContext): Promise<Plan> {
  return madeOf(agent).plan(requestContext)
}

type Frozen = FrozenVersion & OfProject & { agentId: AgentIdType }

/**
 * The version's read for the run the context carries, of this agent's version: one written before
 * E4 reads as the kit's reads of its connections, found without the declaration they are part of.
 */
function versionReader(deps: AgentDeps, frozen: Frozen) {
  return oncePerRun(async (requestContext): Promise<VersionRead> => {
    const run = agentRunIn(requestContext)
    const ofFrozen =
      run?.agentId === frozen.agentId &&
      run.scope.companyId === frozen.companyId &&
      run.scope.projectId === frozen.projectId
    if (run === undefined || !ofFrozen) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_RUN_MISSING' } })
    }
    const { companyId, personId, projectId } = run.scope
    const place = { kind: 'PROJECT', projectId } as const
    const legacy = principalFor({
      ...{ consumer: 'assistant', companyId, personId, place },
      choice: { kind: 'CHOSEN', connections: frozen.connections },
    })
    const tools: readonly FrozenTool[] = frozen.byTool
      ? frozen.tools
      : [
          ...frozen.tools,
          ...legacyTools(await deps.connectors.kitReads(legacy), frozen.connections),
        ]
    const selected = new Set<ConnectionId>([
      ...frozen.connections,
      ...tools.map((each) => each.connectionId),
    ])
    const stored: Stored = {
      place,
      choice: { kind: 'CHOSEN', connections: [...selected] },
      ceiling: { kind: 'DECLARED', declared: declaredOf(tools) },
      attended: true,
    }
    return { run, owner: { companyId, personId }, tools, selected, stored }
  })
}

function planner(deps: AgentDeps, frozen: Frozen, versionOf: ReturnType<typeof versionReader>) {
  return oncePerRun(async (requestContext): Promise<Plan> => {
    const version = await versionOf(requestContext)
    const start = await conversationStart(deps.queue, version.owner, frozen.model ?? undefined)
    const thread = conversationRun(requestContext)
    const runScope: RunScope = {
      ...{ kind: 'agents', owner: version.owner, ...version.stored },
      conversation:
        thread === undefined ? { kind: 'TRIAL' } : { kind: 'THREAD', id: thread.sessionId },
    }
    const scope = principalOf(runScope)
    const offered = await deps.connectors.connections(scope)
    const { projectId } = version.run.scope
    const toolScope = await agentToolScope(deps, runScope, {
      ...{ offered, projectId, readsApp: frozen.appData, agentId: frozen.agentId },
    })
    const machine = frozen.machine
    return { ...{ ...version, start, runScope, scope, machine }, offered, toolScope }
  })
}

/**
 * Who the version's writes speak as: the published version, answered for by who made it active
 * when the run began, or the person on its draft.
 */
function authorOf(frozen: FrozenVersion & { agentId: AgentIdType }): WriteAuthor {
  return frozen.source.kind === 'VERSION'
    ? {
        kind: 'VERSION',
        agentId: frozen.agentId,
        number: frozen.source.number,
        answeredBy: frozen.source.answeredBy,
      }
    : { kind: 'DRAFT' }
}

/**
 * The run's tools, made once: the program tool fixes the ids of the tools it orchestrates when it is
 * made (`createCodeMode`), and its instructions list them, so the instructions and the tools of a
 * run come from one making. The Computador's, the web's, `show_file` and the writes stay direct
 * only: the program calls a tool's `execute` without its approval.
 */
function runToolsOf(
  deps: AgentDeps,
  frozen: Frozen,
  plan: (requestContext: RequestContext) => Promise<Plan>,
) {
  const machines = frozen.machine ? deps.machines : undefined
  const ofMachine =
    machines && machineTools(deps, machines, async (context) => (await plan(context)).runScope)
  const companyOf = agentTools(deps, turnKey.of, frozen.agentId)
  return oncePerRun(async (requestContext) => {
    const { scope, offered, start, tools, toolScope } = await plan(requestContext)
    const preset = await presetTools({
      ...{ ...deps, scope, tools, turnOf: turnKey.of },
      ...{ author: authorOf(frozen), offered },
      approval: { ...deps, openWrites: deps.connectors.openWrites },
    })
    const ofTheAgent: ToolsInput = {
      ...(await companyOf(toolScope)),
      ...codeTools({ ...deps.codeTools, scope, tools, turnOf: turnKey.of }),
      ...preset.reads,
    }
    const program = machines === undefined ? undefined : codeModeOf(ofTheAgent, machines.codeMode)
    return {
      program,
      writes: Object.keys(preset.writes).length > 0,
      tools: {
        ...(frozen.web ? toolsOf(start.model) : {}),
        ...ofMachine,
        ...(program === undefined ? {} : { [MACHINE_TOOL.codeMode]: program.tool }),
        ...ofTheAgent,
        ...preset.writes,
      },
    }
  })
}

/**
 * The `Agent` of a version, which runs alone (step 24.3, U2): its model is the version's, or its
 * person's first with `model: null`; its turn is taken from the run in the `requestContext`, with
 * that model held, then the account's pick, as the Assistant's. Its instructions are Conexus's
 * fixed message, the conversation's block and the version's; its tools are the version's, over
 * what the Projeto still offers. The same agent serves every person of the company: the person is
 * the run's.
 */
export function agentOf(deps: AgentDeps, frozen: Frozen): Agent {
  const versionOf = versionReader(deps, frozen)
  const plan = planner(deps, frozen, versionOf)
  const toolsOfRun = runToolsOf(deps, frozen, plan)
  const { agent } = agentOfSpec(
    {
      id: agentKey(frozen.agentId),
      name: frozen.name,
      description: frozen.description,
      prompt: {
        kind: 'MESSAGES',
        parts: [
          { kind: 'FIXED', text: CONEXUS_PROMPT },
          { kind: 'TEXT', text: dataOrder() },
          {
            kind: 'OF_RUN',
            async of(requestContext) {
              const { runScope, toolScope } = await plan(requestContext)
              const shown = await companyConnections(toolScope)
              return blockOf(await deps.speakersOf(runScope), shown)
            },
          },
          {
            kind: 'OF_RUN',
            async of(requestContext) {
              const { writes } = await toolsOfRun(requestContext)
              return `${frozen.instructions}\n\n${writes ? WRITES : READ_ONLY}`
            },
          },
          {
            kind: 'OF_RUN',
            async of(requestContext) {
              return (await toolsOfRun(requestContext)).program?.instructions
            },
          },
        ],
      },
      model: {
        kind: 'OF_RUN',
        of: async (requestContext) => routedModel((await plan(requestContext)).start.model),
      },
      tools: async (requestContext) => (await toolsOfRun(requestContext)).tools,
      approval: { kind: 'THE_WRITE_ASKS' },
      memory: frozen.memory.observational ? deps.memories.observational : deps.memories.plain,
      turn: {
        kind: 'RUN',
        id: 'conexus-agent-turn',
        none: 'NO_TURN',
        resumes: false,
        async take(requestContext) {
          if (agentRunIn(requestContext) === undefined) return { kind: 'NONE' }
          const { run, start } = await plan(requestContext)
          const model = { id: start.model, effort: start.effort }
          return {
            kind: 'TAKEN',
            turn: await agentTurnOf(deps.queue, requestContext, { run, model }),
          }
        },
      },
    },
    deps,
  )
  made.set(agent, { plan, version: versionOf })
  return agent
}
