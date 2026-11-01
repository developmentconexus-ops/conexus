import { readFileSync } from 'node:fs'
import type { Overview } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, ASSISTANT_TOOL, BUILDER_TOOL, SKILL_TOOLS } from '@conexus/hub-api'
import { Agent } from '@mastra/core/agent'
import type { BuiltinToolId } from '@mastra/core/agent-controller'
import { AgentController } from '@mastra/core/agent-controller'
import { CyberRefusalHandler } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { PostgresStore } from '@mastra/pg'
import type { FastifyInstance } from 'fastify'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { ConnectorAccess } from '../connectors/public.ts'
import { connectorTools } from '../connectors/public.ts'
import type { ReleaseScope } from '../conversation/public.ts'
import {
  MODEL_TIMEOUT,
  sessionModel,
  skillOf,
  toolsOf,
  workspaceMetadataLive,
} from '../conversation/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import {
  accountErrorProcessors,
  accountPick,
  MAX_PROCESSOR_RETRIES,
} from '../model-accounts/public.ts'
import { sessionScope } from './context.ts'
import type { Speakers } from './instructions.ts'
import { assistantInstructions } from './instructions.ts'
import { assistantMemory } from './memory.ts'
import { overviewTool } from './overview.ts'
import type { AssistantProjects } from './ports.ts'
import { releaseConversations } from './release.ts'
import { registerAssistantRoutes } from './routes.ts'
import { assistantTurns, turnKeyIn } from './turn.ts'

type AssistantConnectors = Connectors['assistant']
type AssistantConnection = Awaited<ReturnType<AssistantConnectors['connections']>>[number]

const MODE = 'conversa'
/** The controller's own tools are all off: the Assistant asks no card, keeps no task list and calls no subagent. */
const BUILTIN_TOOLS: BuiltinToolId[] = [
  'ask_user',
  'submit_plan',
  'task_write',
  'task_update',
  'task_complete',
  'task_check',
  'subagent',
]
/** The closed set the mode offers the model (criterion 12), which the controller enforces as it calls it. */
const AVAILABLE_TOOLS = [
  BUILDER_TOOL.connectorRead,
  BUILDER_TOOL.connectorNotes,
  ASSISTANT_TOOL.overview,
  BUILDER_TOOL.webFetch,
  BUILDER_TOOL.webSearch,
  ...SKILL_TOOLS,
]

/** What Conexus does, read by the Assistant when the task asks (the `conexus` skill). */
const CONEXUS_SKILL = skillOf({
  directory: 'conexus',
  content: readFileSync(new URL('./skills/conexus/SKILL.md', import.meta.url), 'utf8'),
  references: {},
})

export type Assistant = ReturnType<typeof createAssistant>

type Deps = {
  storage: PostgresStore
  database: Database
  identity: IdentityPorts
  connectors: AssistantConnectors
  projects: AssistantProjects
  queue: QueueDeps
  log: FailureLog
}

function readerScope(scope: SessionScope) {
  return { kind: 'COMPANY', companyId: scope.companyId, personId: scope.personId } as const
}

/** Admits the person who may ask now, or `NOT_FOUND` (S10). */
function admitAsker(deps: Deps, tx: ReadTx, scope: SessionScope) {
  return deps.identity.admitMember({
    tx,
    personId: scope.personId,
    companyId: scope.companyId,
    action: 'askAssistant',
  })
}

/** The company, the person with their role, and the Projeto the conversation lives in, for its block. */
function speakersOf(deps: Deps, scope: SessionScope): Promise<Speakers> {
  return deps.database.read(readerScope(scope), async (tx) => {
    const admitted = await admitAsker(deps, tx, scope)
    const { companyId } = scope
    const company = await deps.identity.companyNameOf(tx, { admitted, companyId })
    const person = await deps.identity.personNameOf(tx, scope.personId)
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
    return { company, person, role: admitted.role, projectName: project?.name }
  })
}

/** Each live Projeto of the company with its app, published or not. */
function projectsOf(deps: Deps, scope: SessionScope): Promise<Overview['projects']> {
  return deps.database.read(readerScope(scope), async (tx) => {
    await admitAsker(deps, tx, scope)
    const projects: Overview['projects'][number][] = []
    for (const each of await deps.projects.liveProjectsOf(tx, scope.companyId)) {
      const { publishedVersion } = await deps.projects.versionNumbersOf(tx, each.projectId)
      const app =
        publishedVersion === null
          ? ({ kind: 'NOT_PUBLISHED' } as const)
          : ({ kind: 'PUBLISHED', version: String(publishedVersion) } as const)
      projects.push({ ...each, app })
    }
    return projects
  })
}

/**
 * The connector tools' access for a conversation (U1's door): the chosen connections its place
 * offers, each read counted by the turn's key; the model gets the cut, never the whole answer.
 */
function accessOf(
  deps: Deps,
  scope: SessionScope,
  chosen: readonly AssistantConnection[],
): ConnectorAccess {
  return {
    connections: chosen,
    async read(call, requestContext) {
      const turn = turnKeyIn(requestContext)
      if (turn === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'CONNECTOR_TOOL_WITHOUT_TURN' },
        })
      }
      const answered = await deps.connectors.read(scope, { ...call, turn })
      if (answered.kind !== 'OK') return answered
      const { whole: _whole, ...cut } = answered
      return cut
    },
    notes: (connectionId) => deps.connectors.notes(scope, connectionId),
    wording: { whose: 'this conversation chose', limit: '50 connector calls per answer' },
  }
}

type Offered = (requestContext: RequestContext) => Promise<readonly AssistantConnection[]>

/** What the run's place offers, each with whether the conversation chose it, read once per run (as `sessionScope`). */
function offeredFor(deps: Deps): Offered {
  const read = new WeakMap<RequestContext, Promise<readonly AssistantConnection[]>>()
  return (requestContext) => {
    let found = read.get(requestContext)
    if (found === undefined) {
      found = sessionScope(requestContext).then((scope) =>
        scope === undefined ? [] : deps.connectors.connections(scope),
      )
      read.set(requestContext, found)
    }
    return found
  }
}

/**
 * The agent (`template-agent-harness`, `agents/agent.ts:33-76`): its instructions, tools and skills
 * from the run's scope, the Builder's model of the session and the Builder's processors by name.
 */
function assistantAgent(
  deps: Deps,
  parts: { memory: ReturnType<typeof assistantMemory>; turns: ReturnType<typeof assistantTurns> },
) {
  const { queue } = deps
  const offeredOf = offeredFor(deps)
  async function chosenOf(requestContext: RequestContext) {
    return (await offeredOf(requestContext)).filter((each) => each.chosen)
  }
  const overview = overviewTool({
    scopeOf: sessionScope,
    projectsOf: (scope) => projectsOf(deps, scope),
    connectionsOf: async (requestContext) =>
      (await offeredOf(requestContext)).map(({ connectionId, connector, name, chosen }) => ({
        connectionId,
        connector,
        name,
        chosen,
      })),
  })
  return new Agent({
    id: ASSISTANT_CONTROLLER,
    name: 'Assistant',
    instructions: assistantInstructions({
      scopeOf: sessionScope,
      chosenOf: offeredOf,
      speakersOf: (scope) => speakersOf(deps, scope),
    }),
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: async ({ requestContext }) => {
      const scope = await sessionScope(requestContext)
      const chosen = await chosenOf(requestContext)
      return {
        ...toolsOf(sessionModel(requestContext)),
        [ASSISTANT_TOOL.overview]: overview,
        ...(scope === undefined
          ? {}
          : connectorTools(accessOf(deps, scope, chosen), { noteSave: false })),
      }
    },
    skills: async ({ requestContext }) => [
      CONEXUS_SKILL,
      ...(await chosenOf(requestContext)).map((each) =>
        skillOf({ directory: each.skill.name, ...each.skill }),
      ),
    ],
    inputProcessors: [parts.turns.processor, accountPick(queue)],
    outputProcessors: [new CyberRefusalHandler(), workspaceMetadataLive],
    errorProcessors: accountErrorProcessors(queue),
    maxRetries: 0,
    maxProcessorRetries: MAX_PROCESSOR_RETRIES,
    defaultOptions: { modelSettings: { timeout: MODEL_TIMEOUT } },
    memory: parts.memory,
  })
}

/**
 * The Assistant (step 24.1, U2, `H1`): one agent beside the Builder in the same `Mastra`, its own
 * controller, every conversation a thread under its owner (`assistantOwner`) with its place in the
 * thread's marks and its choice in a thread setting (`context.ts`). Its instructions, tools and
 * skills come from the run's scope; its turn takes the owner's accounts without a Projeto; its
 * processors and memory are the Builder's.
 */
export function createAssistant(deps: Deps) {
  const { storage, queue } = deps
  const memory = assistantMemory({ storage, queue })
  const turns = assistantTurns({ queue })
  const agent = assistantAgent(deps, { memory, turns })
  const controller = new AgentController({
    id: ASSISTANT_CONTROLLER,
    storage,
    memory,
    agent,
    modes: [{ id: MODE, availableTools: AVAILABLE_TOOLS }],
    disableBuiltinTools: BUILTIN_TOOLS,
    // Decision 0053: nothing waits to be approved; the systems get no write.
    initialState: { yolo: true },
  })
  turns.watch(controller)

  return Object.freeze({
    controller,
    memory,
    routes: (app: FastifyInstance) => registerAssistantRoutes(app, { ...deps, controller, memory }),
    release: (scope: ReleaseScope) =>
      releaseConversations({ controller, memory, log: deps.log }, scope),
    /** The memory's work after the runs, which `drain` stopped, before Mastra stops. */
    async close(): Promise<void> {
      await memory.settled()
    },
  })
}
