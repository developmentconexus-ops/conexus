import type { CompanyData, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_TOOL } from '@conexus/hub-api'
import { createCodingAgent } from '@mastra/core/coding-agent'
import type { RequestContext } from '@mastra/core/request-context'
import type { MastraCompositeStore } from '@mastra/core/storage'
import { webFetchTool } from '@mastra/core/tools'
import type { Access, Principal } from '../../hub/access/public.ts'
import type { BuilderData } from '../../hub/apps/public.ts'
import type { ProjectCopiesView } from '../../hub/copies/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { dataContext } from '../app-data/public.ts'
import type { CompanyToolDeps } from '../company-tools/public.ts'
import { companyConnections, companyToolScope, companyTools } from '../company-tools/public.ts'
import type { BuilderConnectors, GrantedConnection } from '../connectors/public.ts'
import { builderAccess } from '../connectors/public.ts'
import type { DataBinding, RunScope } from '../controller-kit/public.ts'
import {
  ASK_USER_TOOL,
  agentDefaults,
  CONVERSATION_MODE,
  controllerOf,
  conversationMemory,
  createAskUserTool,
  dataContextOf,
  oncePerRun,
  principalOf,
  sessionModel,
  skillOf,
  TITLE,
  toolsOf,
} from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { APP_SKILLS, builderInstructions } from './instructions.ts'
import { TOOL_CLOSURE } from './permissions.ts'
import { createSubmitPlanTool, SUBMIT_PLAN_TOOL } from './plan-tools.ts'
import { checkTool, conexusCheck } from './processors.ts'
import type { ConversationIndex, ProjectOf } from './turn-of.ts'
import { builderRuns, projectOfRun, turnOf } from './turn-of.ts'

type Ids = { companyId: CompanyId; personId: PersonId; projectId: ProjectId }

function idsOf(run: RunScope): Ids {
  if (run.place.kind !== 'PROJECT') {
    throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'RUN_WITHOUT_PROJECT' } })
  }
  return { ...run.owner, projectId: run.place.projectId }
}

/**
 * The Builder's company tools: its Projeto's granted connections through its door, each call
 * counted by the run Mastra runs, its notebook's write and `copy_propose` where a connector copies.
 */
function companyDeps(deps: {
  connectors: BuilderConnectors
  runs: Runs
  companyData: (principal: Principal, context: DataBinding) => CompanyData
  log: FailureLog
}): CompanyToolDeps<GrantedConnection> {
  function doorOf(run: RunScope) {
    const who = { ...idsOf(run), runIdOf: (context: RequestContext) => deps.runs.runIdOf(context) }
    return builderAccess(deps.connectors, [], who, deps.log)
  }
  return {
    log: deps.log,
    data: (run) => deps.companyData(principalOf(run), dataContextOf(run)),
    connector: {
      read: (run, call, requestContext) => doorOf(run).access.read(call, requestContext),
      notes: (run, connectionId) => doorOf(run).access.notes(connectionId),
      saveNote: (run, call, requestContext) => doorOf(run).save(call, requestContext),
      propose: {
        call: (run, call, requestContext) => doorOf(run).propose(call, requestContext),
        copying: (listed) => listed.filter((each) => each.copies),
      },
    },
  }
}

/**
 * The run's company tools' scope, read once for its tools, its skills and its instructions. The
 * app's data is offered when the person converses with the Builder in the Projeto; each call is
 * admitted again.
 */
function toolScopes(
  deps: { access: Pick<Access, 'viewOf'>; connectors: BuilderConnectors; data: BuilderData },
  runOf: ReturnType<typeof builderRuns>,
) {
  return oncePerRun(async (requestContext: RequestContext) => {
    const run = await runOf(requestContext)
    if (run === undefined) return undefined
    const ids = idsOf(run)
    const admitted = (await deps.data.access(ids)).kind === 'ADMITTED'
    return companyToolScope(
      run,
      { access: deps.access, connections: (each) => deps.connectors.granted(idsOf(each)) },
      {
        noteSave: true,
        appData: admitted ? { kind: 'READ_AND_CHECK', data: deps.data, ids } : { kind: 'NONE' },
      },
    )
  })
}

/**
 * The "## Data" block of the turn, read once for the run: a Hub database that does not answer is a
 * line in the block; a person who is not a member of the company makes the read fail, and the turn
 * does not start.
 */
function dataFor(
  copies: (ids: {
    companyId: CompanyId
    personId: PersonId
    projectId: ProjectId
  }) => Promise<ProjectCopiesView>,
  projectOf: ProjectOf,
): (requestContext: RequestContext) => Promise<string> {
  return oncePerRun(async (requestContext) => {
    const ids = await projectOf(requestContext)
    return ids === undefined ? '' : dataContext(await copies(ids))
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
  data: BuilderData
  /** The access door: what the Projeto offers the person, which every company tool names. */
  access: Pick<Access, 'viewOf'>
  /** The company's data, bound to the Projeto and its granted connections, and to the conversation that reads. */
  companyData: (principal: Principal, context: DataBinding) => CompanyData
  copies: (ids: {
    companyId: CompanyId
    personId: PersonId
    projectId: ProjectId
  }) => Promise<ProjectCopiesView>
  log: FailureLog
  projectName: Parameters<typeof builderInstructions>[0]['projectName']
}) {
  const { storage } = deps
  const check = checkTool(deps.runs)
  const { queue } = deps
  const memory = conversationMemory({ storage, queue, ...BUILDER_MEMORY })
  const runOf = builderRuns({ index: deps.index, memory })
  const projectOf = projectOfRun(runOf)
  const scopeOf = toolScopes(deps, runOf)
  const tools = companyDeps(deps)
  async function granted(requestContext: RequestContext) {
    const scope = await scopeOf(requestContext)
    return scope === undefined ? [] : companyConnections(scope)
  }
  const defaults = agentDefaults(queue, { processor: turnOf(deps) })
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
      const scope = await scopeOf(requestContext)
      // The order of step 20 (criterion 13a): the model's request stays byte for byte the same.
      return {
        web_fetch: webFetchTool,
        [BUILDER_TOOL.check]: check,
        ...toolsOf(sessionModel(requestContext)),
        ...(scope === undefined ? {} : await companyTools(scope, 'builder', tools)),
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
