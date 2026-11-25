import { readFileSync } from 'node:fs'
import type { CompanyData, CompanyId, ConversationId, Person } from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { TaskSignalProvider } from '@mastra/core/signals'
import type { MastraCompositeStore } from '@mastra/core/storage'
import type { FastifyInstance } from 'fastify'
import type {
  ConversationMachine,
  ConversationMachines,
  MachineTuning,
} from '../../harness/machine/public.ts'
import {
  createConversationMachines,
  machinePart,
  PACKAGE_HOSTS,
  showFileTool,
} from '../../harness/machine/public.ts'
import type { HubPart } from '../../harness/mastra/public.ts'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import { subagentModel } from '../../harness/model-accounts/public.ts'
import type {
  ConversationSpec,
  DataBinding,
  Owner,
  ReleaseScope,
  Speakers,
} from '../../harness/spec/public.ts'
import {
  ASK_USER_TOOL,
  admitAsker,
  blockOf,
  CONVERSATION_MODE,
  createAskUserTool,
  dataContextOf,
  MODEL_TIMEOUT,
  mountAgent,
  principalOf,
  releaseByMarks,
  sessionModel,
  skillOf,
  toolsOf,
} from '../../harness/spec/public.ts'
import type {
  CompanyProjects,
  CompanyToolDeps,
  CompanyToolScope,
} from '../../harness/tools/public.ts'
import {
  byPrincipal,
  companyConnections,
  companyReadSearch,
  companyTools,
  dataOrder,
  projectsOf,
} from '../../harness/tools/public.ts'
import type { Access, Place, Principal } from '../../hub/access/public.ts'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { profileReadOnlyInRuns } from './automation-memory.ts'
import { AVAILABLE_TOOLS } from './available-tools.ts'
import { chosenConnections } from './chosen.ts'
import { companyMemory, companyScopes } from './company-memory.ts'
import { readsFiles } from './connector-access.ts'
import type { RunOf } from './context.ts'
import { assistantRuns, machineMarks } from './context.ts'
import { machineUploads, READ_MEDIA } from './files.ts'
import type { HandOffDoors } from './handoff.ts'
import { registerHandOff } from './handoff.ts'
import { FIXED, MODEL_BLOCKS } from './instructions.ts'
import type { maysOf } from './mays.ts'
import { assistantMemory } from './memory.ts'
import type { OpenDeps } from './open.ts'
import { admitted, asked, openConversation } from './open.ts'
import { handOffOf, proposeTools } from './propose.ts'
import { proposeAutomationTool } from './propose-automation.ts'
import { proposeCompanyMemoryTool } from './propose-company-memory.ts'
import { RESEARCH, researchOnly } from './research.ts'
import { registerAssistantRoutes } from './routes.ts'
import type { ScopeOf } from './run-reads.ts'
import { runReads } from './run-reads.ts'
import { assistantTurn, turnEnd, turnKey } from './turn.ts'

type AssistantConnectors = Connectors['assistant']
type AssistantConnection = Awaited<ReturnType<AssistantConnectors['connections']>>[number]

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
  /** The access door: what a place offers the owner (issue 1147). */
  access: Pick<Access, 'viewOf'>
  /** The company's data, bound to the conversation's scope; and to the conversation that reads. */
  companyData: (principal: Principal, context: DataBinding) => CompanyData
  projects: CompanyProjects
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

/** The company's tools of the Assistant's runs and its helper's, every call through the door as the run's principal. */
function companyDeps(deps: Deps): CompanyToolDeps {
  return {
    ...{ log: deps.log, savedAt: readsFiles() },
    data: (run) => deps.companyData(principalOf(run), dataContextOf(run)),
    connector: byPrincipal(deps.connectors, turnKey.of),
    projects: (run) => projectsOf(deps, run),
  }
}

const FIRST: readonly string[] = [ASSISTANT_TOOL.overview]

/** The company's tools split as the request lists them: the overview before the Assistant's own, the connectors' and the data's after. */
async function inRequestOrder(
  scope: CompanyToolScope<AssistantConnection> | undefined,
  tools: CompanyToolDeps,
) {
  const company = Object.entries(
    scope === undefined ? {} : await companyTools(scope, 'assistant', tools),
  )
  return {
    first: Object.fromEntries(company.filter(([name]) => FIRST.includes(name))),
    rest: Object.fromEntries(company.filter(([name]) => !FIRST.includes(name))),
  }
}

type Parts = {
  memory: ReturnType<typeof assistantMemory>
  company: ReturnType<typeof companyMemory>
  machines: ConversationMachines
  scopeOf: RunOf
  toolScopeOf: ScopeOf<AssistantConnection>
  tools: CompanyToolDeps
  maysFor: ReturnType<typeof maysOf>
  speakersFor: (requestContext: RequestContext) => Promise<Speakers | undefined>
}

/** The connections the run's view chose and the company's tools reach; none outside a conversation. */
function chosenIn({ toolScopeOf }: Parts) {
  return async (requestContext: RequestContext) => {
    const scope = await toolScopeOf(requestContext)
    return scope === undefined ? [] : companyConnections(scope)
  }
}

/** The tools of a run, in the order the request lists them: the model's provider's, the company's first, the Assistant's own, the hand-offs, the rest. */
function assistantTools(parts: Parts) {
  const { scopeOf, toolScopeOf, maysFor, machines } = parts
  const showFile = showFileTool(machines)
  const proposeMemory = proposeCompanyMemoryTool({ memory: parts.company, scopeOf })
  const proposals = proposeTools(machines)
  const chosenOf = chosenIn(parts)
  return async (requestContext: RequestContext) => {
    const scope = await scopeOf(requestContext)
    const { byAutomation, automate } = await maysFor(requestContext)
    const { first, rest } = await inRequestOrder(await toolScopeOf(requestContext), parts.tools)
    return {
      ...toolsOf(sessionModel(requestContext)),
      ...first,
      [ASSISTANT_TOOL.showFile]: showFile,
      [ASSISTANT_TOOL.proposeCompanyMemory]: proposeMemory,
      ...(automate
        ? {
            [ASSISTANT_TOOL.proposeAutomation]: proposeAutomationTool(
              await chosenOf(requestContext),
            ),
          }
        : {}),
      ...handOffOf(scope, proposals, byAutomation),
      ...rest,
    }
  }
}

/** The conversation's block of the instructions; a run with no conversation is the Hub's defect. */
function blockOfRun(parts: Parts) {
  const chosenOf = chosenIn(parts)
  return async (requestContext: RequestContext) => {
    const speakers = await parts.speakersFor(requestContext)
    if (speakers === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'PROMPT_WITHOUT_CONVERSATION' },
      })
    }
    const [chosen, may] = await Promise.all([
      chosenOf(requestContext),
      parts.maysFor(requestContext),
    ])
    return blockOf(speakers, chosen, may)
  }
}

const MODEL = { kind: 'SESSION', switched: 'ASSISTANT_MODEL_SET' } as const

/**
 * The Assistant's ficha: its instructions, tools and skills from the run's scope, the session's
 * model, and the Builder's processors by name around the account's pick (the reads' search, the
 * helper's closing and the automations' profile before it; the person's files to the machine after).
 */
function assistantSpec(deps: Deps, parts: Parts): ConversationSpec {
  const { queue, log } = deps
  const { scopeOf, toolScopeOf, machines } = parts
  const chosenOf = chosenIn(parts)
  return {
    kind: 'assistant',
    name: 'Assistant',
    prompt: {
      kind: 'MESSAGES',
      parts: [
        { kind: 'FIXED', text: FIXED },
        { kind: 'TEXT', text: dataOrder() },
        { kind: 'BY_MODEL', blocks: MODEL_BLOCKS },
        { kind: 'OF_RUN', of: blockOfRun(parts) },
      ],
    },
    model: MODEL,
    tools: assistantTools(parts),
    // Decision 0053: nothing waits to be approved; the systems get no write.
    approval: { kind: 'NOTHING_ASKS' },
    turn: assistantTurn({ queue, scopeOf }),
    // Before the account's pick, which flattens the tools for CLIProxy's Google path: the search
    // that loads the reads and the helper's closing. The person's files go last, once it has picked.
    processors: {
      beforePick: [
        companyReadSearch(toolScopeOf, parts.tools),
        researchOnly,
        profileReadOnlyInRuns(async (requestContext) => {
          return (await scopeOf(requestContext))?.attended === false
        }),
      ],
      afterPick: [machineUploads({ log })],
    },
    skills: async ({ requestContext }) => [
      CONEXUS_SKILL,
      ...(await chosenOf(requestContext)).map((each) =>
        skillOf({ directory: each.skill.name, ...each.skill }),
      ),
    ],
    signals: [new TaskSignalProvider()],
    threads: parts.memory,
    ...companyScopes({ memory: parts.company, scopeOf }),
    mode: { id: CONVERSATION_MODE, availableTools: AVAILABLE_TOOLS },
    // The helper's `connector_read` is made for each run, closed on the conversation's scope: the
    // helper's own context cannot find the conversation (`research.ts`).
    own: {
      fixed: { [ASK_USER_TOOL]: createAskUserTool() },
      perRun: async ({ requestContext }) => {
        const scope = await toolScopeOf(requestContext)
        return scope === undefined ? {} : companyTools(scope, 'research', parts.tools)
      },
    },
    subagents: { types: [RESEARCH], model: subagentModel(queue, MODEL_TIMEOUT.stepMs) },
    // The conversation's machine (Factory `session-sandbox.ts:29-36`); none outside a conversation.
    workspace: ({ requestContext }) => machines.workspace(requestContext),
  }
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
  const scopeOf = assistantRuns({ memory, chosenOf: chosen.of })
  const machines = createConversationMachines(
    {
      hosts: PACKAGE_HOSTS,
      otherTemplate: 'resume',
      readMedia: READ_MEDIA,
      marks: machineMarks(chosen.of),
    },
    { ...deps.machine, log: deps.log },
    deps.machineTuning,
  )
  const { each, ...wired } = machinePart(machines)
  const tools = companyDeps(deps)
  const { speakersFor, maysFor, toolScopeOf } = runReads(deps, scopeOf)
  const { controller } = mountAgent(
    assistantSpec(deps, {
      ...{ memory, company, scopeOf, machines },
      ...{ toolScopeOf, tools, maysFor, speakersFor },
    }),
    { queue, storage },
  )
  const opening: OpenDeps = { ...deps, controller, memory, chosen }

  return Object.freeze({
    /** Its controller on the one `Mastra` (`harness/mastra/`), beside the Builder's. */
    part: {
      kind: 'assistant',
      controller,
      memory,
      model: MODEL,
      /** Whether the person may ask the Assistant in the company now (`askAssistant`). */
      async admit(input: { person: Person; companyId: CompanyId }): Promise<void> {
        const owner = { companyId: input.companyId, personId: input.person.id }
        await deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
          await admitAsker(deps.identity, tx, owner)
        })
      },
      async release(scope: ReleaseScope): Promise<void> {
        await releaseByMarks(
          { controller, memory, log: deps.log },
          { kind: 'assistant', scope, code: 'ASSISTANT_CONVERSATIONS_RELEASED', each },
        )
      },
      // Its turn writes in no Projeto: its end saves only the failure it said, and tells where its
      // machine starts (QA F1), as the Builder's tells its steps.
      ...wired,
    } satisfies HubPart,
    /** Admits the person who may ask now, in the place; else `NOT_FOUND` (S10). */
    admit: (owner: Owner, place: Place) => admitted(deps, owner, place, 'askAssistant'),
    /** Admits the person who may create automations now, in the place; else `NOT_FOUND` (S10). */
    admitAutomations: (owner: Owner, place: Place) =>
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
