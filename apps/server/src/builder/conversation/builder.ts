import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_TOOL } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { createCodingAgent } from '@mastra/core/coding-agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import { webFetchTool } from '@mastra/core/tools'
import type { BuilderData } from '../../hub/apps/public.ts'
import type { ProjectCopiesView } from '../../hub/copies/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { builderAppDataTools, dataContext } from '../app-data/public.ts'
import type { BuilderConnectors, GrantedConnection } from '../connectors/public.ts'
import { builderAccess, connectorTools } from '../connectors/public.ts'
import {
  agentDefaults,
  controllerOf,
  conversationMemory,
  oncePerRun,
  sessionModel,
  TITLE,
  toolsOf,
} from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InventoryAsk, OntologyDoor } from '../ontology/public.ts'
import type { Runs } from '../runs/public.ts'
import { APP_SKILLS, builderInstructions, skillOf } from './instructions.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import {
  ASK_USER_TOOL,
  createAskUserTool,
  createSubmitPlanTool,
  SUBMIT_PLAN_TOOL,
} from './plan-tools.ts'
import { checkTool, conexusCheck } from './processors.ts'
import type { ConversationIndex } from './turn-of.ts'
import { projectIn, turnOf } from './turn-of.ts'

const CONVERSATION_MODE = 'conversa'

/**
 * The Projeto's granted connections for a Mastra run, read once for its tools, its skills and its
 * instructions: Mastra resolves each of them with the run's `RequestContext`, and a resumed run
 * brings a new one, so a grant taken between two turns is gone in the next.
 */
function grantedFor(
  port: BuilderConnectors,
  projectOf: ReturnType<typeof projectIn>,
): (requestContext: RequestContext) => Promise<readonly GrantedConnection[]> {
  return oncePerRun(async (requestContext) => {
    const ids = await projectOf(requestContext)
    return ids === undefined ? [] : port.granted(ids)
  })
}

/**
 * Whether the person converses with the Builder in the Projeto, read once for the run (as the
 * connections are) so the data tools are offered or not for the whole turn; each call is admitted again.
 */
function admittedFor(
  data: BuilderData,
  projectOf: ReturnType<typeof projectIn>,
): (
  requestContext: RequestContext,
) => Promise<Parameters<typeof builderAppDataTools>[0]['ids'] | undefined> {
  return oncePerRun(async (requestContext) => {
    const ids = await projectOf(requestContext)
    if (ids === undefined) return undefined
    return (await data.access(ids)).kind === 'ADMITTED' ? ids : undefined
  })
}

/**
 * The "## Data" block of the turn, read once for the run: a failed read of the copies is a line in
 * the block, never a turn that does not start, and a person not admitted gets no block.
 */
function dataFor(
  copies: (ids: { companyId: CompanyId; projectId: ProjectId }) => Promise<ProjectCopiesView>,
  projectOf: ReturnType<typeof projectIn>,
): (requestContext: RequestContext) => Promise<string> {
  return oncePerRun(async (requestContext) => {
    const ids = await projectOf(requestContext)
    return ids === undefined ? '' : dataContext(await copies(ids))
  })
}

/** The Builder's connector tools, `concept_propose` included, and `copy_propose` where a connector copies. */
function builderConnectorTools(
  deps: { connectors: BuilderConnectors; ontology: OntologyDoor; runs: Runs; log: FailureLog },
  granted: readonly GrantedConnection[],
  ids: Omit<Parameters<typeof builderAccess>[3], 'runIdOf'>,
): ToolsInput {
  const who = { ...ids, runIdOf: (context: RequestContext) => deps.runs.runIdOf(context) }
  const { access, concepts, propose } = builderAccess(
    deps.connectors,
    deps.ontology,
    granted,
    who,
    deps.log,
  )
  const copying = granted.filter((each) => each.copies)
  const inventory: InventoryAsk = (call) =>
    deps.ontology.search({ companyId: ids.companyId, ...call })
  return connectorTools(access, {
    concepts,
    inventory,
    propose: { copying, call: propose },
  })
}

/** The Builder's memory words, and its recall of what the observation folded. */
const BUILDER_MEMORY = { ...TITLE.app, recall: 'thread' } as const

/**
 * The Builder (decision 0050): one agent shared by every conversation, its keyless model taken
 * from the session and given its account by the queue's processors, its memory, its title and its
 * observation through the same account, in Mastra's own database. It is Mastra Code's agent
 * (`sdk/src/index.ts:1216-1223`): no workspace of its own, since the controller lends the turn's
 * machine, and the task list's signal with `memory`.
 */
export function createBuilder(deps: {
  storage: MastraCompositeStore
  queue: QueueDeps
  runs: Runs
  index: ConversationIndex
  connectors: BuilderConnectors
  ontology: OntologyDoor
  data: BuilderData
  copies: (ids: { companyId: CompanyId; projectId: ProjectId }) => Promise<ProjectCopiesView>
  log: FailureLog
  projectName: Parameters<typeof builderInstructions>[0]['projectName']
}) {
  const { storage } = deps
  const check = checkTool(deps.runs)
  const projectOf = projectIn(deps.index)
  const granted = grantedFor(deps.connectors, projectOf)
  const admitted = admittedFor(deps.data, projectOf)
  const { queue } = deps
  const defaults = agentDefaults(queue, { processor: turnOf(deps) })
  const memory = conversationMemory({ storage, queue, ...BUILDER_MEMORY })
  const agent = createCodingAgent({
    id: BUILDER_CONTROLLER,
    name: 'Builder',
    instructions: builderInstructions({
      runs: deps.runs,
      projectOf,
      projectName: deps.projectName,
      granted,
      data: dataFor(deps.copies, projectOf),
    }),
    skills: async ({ requestContext }) => [
      ...APP_SKILLS,
      ...(await granted(requestContext)).map((each) =>
        skillOf({ directory: each.skill.name, ...each.skill }),
      ),
    ],
    model: ({ requestContext }) => sessionModel(requestContext),
    tools: async ({ requestContext }) => {
      const ids = await projectOf(requestContext)
      const web = toolsOf(sessionModel(requestContext))
      const conversant = await admitted(requestContext)
      // The order of step 20 (criterion 13a): the model's request stays byte for byte the same.
      return {
        web_fetch: webFetchTool,
        [BUILDER_TOOL.check]: check,
        ...web,
        ...(ids === undefined
          ? {}
          : builderConnectorTools(deps, await granted(requestContext), ids)),
        ...(conversant === undefined
          ? {}
          : builderAppDataTools({ data: deps.data, ids: conversant })),
      }
    },
    ...defaults,
    workspace: undefined,
    defaultOptions: {
      ...defaults.defaultOptions,
      isTaskComplete: {
        scorers: [conexusCheck({ runs: deps.runs, storage })],
        strategy: 'all',
      },
    },
    memory,
  })
  const controller = controllerOf({
    ...{ kind: 'builder', storage, memory, agent },
    mode: { id: CONVERSATION_MODE, availableTools: TOOL_CLOSURE.availableTools },
    // The conversation's machine (Factory `session-sandbox.ts:29-36`); none outside a conversation.
    workspace: async ({ requestContext, mastra }) => {
      const ids = await projectOf(requestContext)
      return ids === undefined ? undefined : deps.runs.workspaceOf(ids, mastra)
    },
    // `ask_user` and `submit_plan` are ours, under the native ids (`plan-tools.ts`).
    tools: {
      fixed: { [ASK_USER_TOOL]: createAskUserTool(), [SUBMIT_PLAN_TOOL]: createSubmitPlanTool() },
    },
    initialState: TOOL_CLOSURE.initialState,
  })
  return { controller, memory, agent, queue: deps.queue }
}

export type Builder = ReturnType<typeof createBuilder>
