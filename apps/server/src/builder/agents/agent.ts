import { readFileSync } from 'node:fs'
import type {
  AgentId as AgentIdType,
  ConnectionId,
  Effort,
  ModelId,
  OfProject,
} from '@conexus/hub-api'
import {
  AgentId,
  CompanyId,
  MACHINE_TOOL,
  OperationId,
  PersonId,
  ProjectId,
} from '@conexus/hub-api'
import type { AgentInstructions, ToolsInput } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { MastraMemory } from '@mastra/core/memory'
import type { InputProcessor } from '@mastra/core/processors'
import { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Speakers } from '../assistant/public.ts'
import { blockOf } from '../assistant/public.ts'
import type { ConnectorAccess } from '../connectors/public.ts'
import { connectorTools } from '../connectors/public.ts'
import {
  agentDefaults,
  fixedSystem,
  oncePerRun,
  routedModel,
  toolsOf,
  turnKeyOn,
} from '../controller-kit/public.ts'
import type { ConversationMachines } from '../machine/public.ts'
import { showFileTool } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationStart, memoryModelsFor, setTurn, Turn } from '../model-accounts/public.ts'
import type { AppDataPort } from './app-data.ts'
import { appDataTools } from './app-data.ts'
import { codeModeOf } from './code-mode.ts'
import type { CodeToolsDeps } from './code-tools.ts'
import { codeTools } from './code-tools.ts'
import type { FrozenTool, FrozenVersion } from './frozen.ts'
import { legacyTools } from './legacy.ts'
import { answererLeavesAlone } from './publish.ts'
import type { WriteAuthor } from './tools.ts'
import { NEVER_ASKS, presetTools } from './tools.ts'

const FIXED = readFileSync(
  new URL('../conversation/prompt/conexus.md', import.meta.url),
  'utf8',
).trim()
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
function agentRunIn(requestContext: RequestContext): AgentRun | undefined {
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
 * turn (`Turn`'s fixed model), and a new key for the door on the run's context. The turn itself is
 * put on the context by the caller (the controller's turns do it as they take).
 */
export async function agentTurnOf(
  queue: QueueDeps,
  requestContext: RequestContext,
  input: { run: AgentRun; model: { id: ModelId; effort: Effort } },
): Promise<Turn> {
  const { companyId, personId } = input.run.scope
  const owner = { companyId, personId }
  const memoryModels = await memoryModelsFor(queue, owner)
  const turn = new Turn({ ...owner, memoryModels, model: input.model })
  turnKey.start(requestContext)
  return turn
}

export type AgentDeps = {
  database: Database
  identity: Pick<IdentityPorts, 'roleOf' | 'mayUse' | 'mayPublishUnattended'>
  queue: QueueDeps
  connectors: Connectors['assistant']
  appData: AppDataPort
  speakersOf: (scope: SessionScope) => Promise<Speakers>
  /** The 24.1 memory with the observational one, and one without it, each made once. */
  memories: { observational: MastraMemory; plain: MastraMemory }
  /**
   * The conversations' machines, which the agents' controller owns (step 24.4, U4); an agent that
   * runs alone (the Construtor's test of the draft) gets none.
   */
  machines?: Pick<ConversationMachines, 'folder' | 'serving' | 'codeMode'>
  /** The saved tools' calls at the edge (step 24.4, U3). */
  codeTools: CodeToolsDeps
  log: FailureLog
}

/** What a run of the agent reads once: its person's start of the model, the scope and what it still offers. */
export type Plan = {
  run: AgentRun
  start: { model: ModelId; effort: Effort }
  scope: SessionScope
  offered: Awaited<ReturnType<Connectors['assistant']['connections']>>
  /** Whether the version has its Computador: the conversation's machine and `show_file`. */
  machine: boolean
  /** The version's tools: the chosen ones, or for a version written before E4 the kit's reads of its connections. */
  tools: readonly FrozenTool[]
  /** The connections the version selected: the notebook of each, and the home of every tool. */
  selected: ReadonlySet<ConnectionId>
}

/** What a version declares it reads: each chosen tool's connection and operations (decision C1). */
function declaredOf(tools: readonly FrozenTool[]) {
  return tools.flatMap((tool) =>
    tool.kind === 'PRESET'
      ? [{ connectionId: tool.connectionId, operation: tool.operation }]
      : tool.reads.map((operation) => ({
          connectionId: tool.connectionId,
          operation: OperationId.parse(operation),
        })),
  )
}

const plans = new WeakMap<Agent, (requestContext: RequestContext) => Promise<Plan>>()

/** The plan of a run of an agent `agentOf` made, which the agents' controller takes its turn by. */
export function planOf(agent: Agent, requestContext: RequestContext): Promise<Plan> {
  const plan = plans.get(agent)
  if (plan === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_WITHOUT_PLAN' } })
  }
  return plan(requestContext)
}

function planner(deps: AgentDeps, frozen: FrozenVersion & OfProject & { agentId: AgentIdType }) {
  return oncePerRun(async (requestContext): Promise<Plan> => {
    const run = agentRunIn(requestContext)
    const ofFrozen =
      run?.agentId === frozen.agentId &&
      run.scope.companyId === frozen.companyId &&
      run.scope.projectId === frozen.projectId
    if (run === undefined || !ofFrozen) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_RUN_MISSING' } })
    }
    const { companyId, personId, projectId } = run.scope
    const start = await conversationStart(
      deps.queue,
      { companyId, personId },
      frozen.model ?? undefined,
    )
    const place = { kind: 'PROJECT', projectId } as const
    // A version written before E4 reads as the kit's reads of its connections; the connections
    // are found without the version's declaration, which those reads are part of.
    const tools: readonly FrozenTool[] = frozen.byTool
      ? frozen.tools
      : [
          ...frozen.tools,
          ...legacyTools(
            await deps.connectors.kitReads({
              ...{ companyId, personId, place },
              chosen: frozen.connections,
            }),
            frozen.connections,
          ),
        ]
    const selected = new Set<ConnectionId>([
      ...frozen.connections,
      ...tools.map((each) => each.connectionId),
    ])
    const scope: SessionScope = {
      ...{ companyId, personId, place },
      chosen: [...selected],
      agentVersion: {
        kind: 'VERSION',
        declared: declaredOf(tools),
      },
    }
    return {
      ...{ run, start, scope, machine: frozen.machine, tools, selected },
      offered: await deps.connectors.connections(scope),
    }
  })
}

/**
 * Each tool as a copy of its own that never asks (step 24.5): with the controller's `yolo` off,
 * Mastra asks for every tool without a rule of its own, and only a tool's function beats that
 * (`createTool({ requireApproval })`). A copy, so the objects the Builder shares (`web_fetch`) keep
 * theirs.
 */
function neverAsking(tools: ToolsInput): ToolsInput {
  return Object.fromEntries(
    Object.entries(tools).map(([id, tool]) => [
      id,
      Object.assign(Object.create(Object.getPrototypeOf(tool)), tool, {
        requireApproval: NEVER_ASKS,
      }),
    ]),
  )
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
  frozen: FrozenVersion & OfProject & { agentId: AgentIdType },
  plan: (requestContext: RequestContext) => Promise<Plan>,
) {
  const machines = frozen.machine ? deps.machines : undefined
  const showFile = machines === undefined ? undefined : showFileTool(machines)
  return oncePerRun(async (requestContext) => {
    const { run, scope, offered, start, tools, selected } = await plan(requestContext)
    const access: ConnectorAccess = {
      connections: offered.filter((each) => selected.has(each.connectionId)),
      log: deps.log,
      read: (call, context) => deps.connectors.read(scope, { ...call, turn: turnKey.of(context) }),
      notes: (connectionId) => deps.connectors.notes(scope, connectionId),
      wording: { whose: 'this agent reads', limit: '50 connector calls per answer' },
    }
    const { companyId, personId, projectId } = run.scope
    const mayReadApp =
      frozen.appData && (await deps.appData.hasApp({ scope: { companyId, personId }, projectId }))
    const preset = await presetTools({
      ...{ ...deps, scope, tools, turnOf: turnKey.of },
      ...{ author: authorOf(frozen), offered },
      leavesAlone: (version, target) =>
        answererLeavesAlone(deps, frozen.companyId, version.answeredBy, target),
    })
    const ofTheAgent: ToolsInput = {
      ...neverAsking({
        ...connectorTools(access, { noteSave: false, reads: false }),
        ...(mayReadApp
          ? appDataTools({ appData: deps.appData, scope: { companyId, personId }, projectId })
          : {}),
        ...codeTools({ ...deps.codeTools, scope, tools, turnOf: turnKey.of }),
      }),
      ...preset.reads,
    }
    const program = machines === undefined ? undefined : codeModeOf(ofTheAgent, machines.codeMode)
    return {
      program,
      writes: Object.keys(preset.writes).length > 0,
      tools: {
        ...neverAsking({
          ...(frozen.web ? toolsOf(start.model) : {}),
          ...(showFile === undefined ? {} : { [MACHINE_TOOL.showFile]: showFile }),
          ...(program === undefined ? {} : { [MACHINE_TOOL.codeMode]: program.tool }),
        }),
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
export function agentOf(
  deps: AgentDeps,
  frozen: FrozenVersion & OfProject & { agentId: AgentIdType },
): Agent {
  const plan = planner(deps, frozen)
  const turn: InputProcessor = {
    id: 'conexus-agent-turn',
    async processInput({ requestContext, messages, abort }) {
      if (requestContext === undefined || agentRunIn(requestContext) === undefined)
        return abort('NO_TURN')
      const { run, start } = await plan(requestContext)
      setTurn(
        requestContext,
        await agentTurnOf(deps.queue, requestContext, {
          run,
          model: { id: start.model, effort: start.effort },
        }),
      )
      return messages
    },
  }
  const toolsOfRun = runToolsOf(deps, frozen, plan)
  const agent = new Agent({
    id: agentKey(frozen.agentId),
    name: frozen.name,
    description: frozen.description,
    instructions: async ({ requestContext }) => {
      const { scope, offered, selected } = await plan(requestContext)
      const { program, writes } = await toolsOfRun(requestContext)
      const shown = offered.filter((each) => selected.has(each.connectionId))
      return [
        fixedSystem(FIXED),
        { role: 'system', content: blockOf(await deps.speakersOf(scope), shown) },
        { role: 'system', content: `${frozen.instructions}\n\n${writes ? WRITES : READ_ONLY}` },
        ...(program === undefined
          ? []
          : [{ role: 'system' as const, content: program.instructions }]),
      ] satisfies AgentInstructions
    },
    model: async ({ requestContext }) => routedModel((await plan(requestContext)).start.model),
    tools: async ({ requestContext }) => (await toolsOfRun(requestContext)).tools,
    memory: frozen.memory.observational ? deps.memories.observational : deps.memories.plain,
    ...agentDefaults(deps.queue, { processor: turn }),
  })
  plans.set(agent, plan)
  return agent
}
