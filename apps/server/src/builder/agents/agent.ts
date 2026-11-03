import { readFileSync } from 'node:fs'
import type { AgentId as AgentIdType, Effort, ModelId, OfProject } from '@conexus/hub-api'
import { AgentId, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { AgentInstructions } from '@mastra/core/agent'
import { Agent } from '@mastra/core/agent'
import type { MastraMemory } from '@mastra/core/memory'
import type { InputProcessor } from '@mastra/core/processors'
import { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { Speakers } from '../assistant/public.ts'
import { blockOf } from '../assistant/public.ts'
import type { ConnectorAccess } from '../connectors/public.ts'
import { connectorTools } from '../connectors/public.ts'
import { agentDefaults, oncePerRun, turnKeyOn } from '../controller-kit/public.ts'
import { routedModel, toolsOf } from '../conversation/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import { conversationStart, memoryModelsFor, setTurn, Turn } from '../model-accounts/public.ts'
import type { AppDataPort } from './app-data.ts'
import { appDataTools } from './app-data.ts'
import type { FrozenVersion } from './frozen.ts'
import { presetTools } from './tools.ts'

/** Conexus's fixed message, the same bytes as the Assistant's first part (step 24.1). */
const FIXED = readFileSync(
  new URL('../conversation/prompt/conexus.md', import.meta.url),
  'utf8',
).trim()
const CACHED = { anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } } } as const
const READ_ONLY =
  'You only read: no tool of yours writes in a system. When the person asks you to change, save or send something, say that you cannot and what they can do instead.'
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
 * turn (`Turn`'s fixed model), and a new key for the door; put on the run's context.
 */
export async function takeAgentTurn(
  queue: QueueDeps,
  requestContext: RequestContext,
  input: { run: AgentRun; model: { id: ModelId; effort: Effort } },
): Promise<Turn> {
  const { companyId, personId } = input.run.scope
  const owner = { companyId, personId }
  const memoryModels = await memoryModelsFor(queue, owner)
  const turn = new Turn({ ...owner, memoryModels, model: input.model })
  setTurn(requestContext, turn)
  turnKey.start(requestContext)
  return turn
}

export type AgentDeps = {
  queue: QueueDeps
  connectors: Connectors['assistant']
  appData: AppDataPort
  speakersOf: (scope: SessionScope) => Promise<Speakers>
  /** The 24.1 memory with the observational one, and one without it, each made once. */
  memories: { observational: MastraMemory; plain: MastraMemory }
  log: FailureLog
}

/** What a run of the agent reads once: its person's start of the model, the scope and what it still offers. */
export type Plan = {
  run: AgentRun
  start: { model: ModelId; effort: Effort }
  scope: SessionScope
  offered: Awaited<ReturnType<Connectors['assistant']['connections']>>
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
    if (run?.agentId !== frozen.agentId || run.scope.companyId !== frozen.companyId) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'AGENT_RUN_MISSING' } })
    }
    const { companyId, personId, projectId } = run.scope
    const start = await conversationStart(
      deps.queue,
      { companyId, personId },
      frozen.model ?? undefined,
    )
    const chosen = [
      ...new Set([...frozen.connections, ...frozen.tools.map((each) => each.connectionId)]),
    ]
    const scope: SessionScope = {
      companyId,
      personId,
      place: { kind: 'PROJECT', projectId },
      chosen,
    }
    return { run, start, scope, offered: await deps.connectors.connections(scope) }
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
      await takeAgentTurn(deps.queue, requestContext, {
        run,
        model: { id: start.model, effort: start.effort },
      })
      return messages
    },
  }
  const ownConnections = new Set(frozen.connections)
  const agent = new Agent({
    id: agentKey(frozen.agentId),
    name: frozen.name,
    description: frozen.description,
    instructions: async ({ requestContext }) => {
      const { scope, offered } = await plan(requestContext)
      const shown = offered.filter((each) => ownConnections.has(each.connectionId))
      return [
        { role: 'system', content: FIXED, providerOptions: CACHED },
        { role: 'system', content: blockOf(await deps.speakersOf(scope), shown) },
        { role: 'system', content: `${frozen.instructions}\n\n${READ_ONLY}` },
      ] satisfies AgentInstructions
    },
    model: async ({ requestContext }) => routedModel((await plan(requestContext)).start.model),
    tools: async ({ requestContext }) => {
      const { run, scope, offered, start } = await plan(requestContext)
      const access: ConnectorAccess = {
        connections: offered.filter((each) => ownConnections.has(each.connectionId)),
        log: deps.log,
        read: (call, context) =>
          deps.connectors.read(scope, { ...call, turn: turnKey.of(context) }),
        notes: (connectionId) => deps.connectors.notes(scope, connectionId),
        wording: { whose: 'this agent reads', limit: '50 connector calls per answer' },
      }
      const { companyId, personId, projectId } = run.scope
      const mayReadApp =
        frozen.appData && (await deps.appData.hasApp({ scope: { companyId, personId }, projectId }))
      return {
        ...(frozen.web ? toolsOf(start.model) : {}),
        ...connectorTools(access, { noteSave: false }),
        ...(mayReadApp
          ? appDataTools({ appData: deps.appData, scope: { companyId, personId }, projectId })
          : {}),
        ...(await presetTools({ ...deps, scope, tools: frozen.tools, turnOf: turnKey.of })),
      }
    },
    memory: frozen.memory.observational ? deps.memories.observational : deps.memories.plain,
    ...agentDefaults(deps.queue, turn),
  })
  plans.set(agent, plan)
  return agent
}
