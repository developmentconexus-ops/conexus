import type {
  AgentDetail,
  AutomationId,
  FailureCode,
  ProjectId,
  ProjectReadResult,
  ReadyTool,
  TestedResult,
  ToolSearchResult,
  ToolSummary,
} from '@conexus/hub-api'
import {
  AgentId,
  CONSTRUTOR_TOOL,
  ConnectionId,
  CreateAgent,
  DraftPatch,
  OperationId,
  ToolId,
  ToolInput,
  ToolSlug,
  ToolVersionConfig,
} from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import type { ToolExecutionContext } from '@mastra/core/tools'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { AgentService } from '../agents/public.ts'
import type { InProject, OfferedConnection, Tools } from '../tools/public.ts'
import type { AppTable } from './app-tables.ts'

type Refused = { kind: 'REFUSED'; code: FailureCode; field?: string }

/** What the Construtor's tools reach: the U1 services, the Projeto's reads and the draft's test. */
export type ConstrutorDeps = {
  agents: Pick<AgentService, 'create' | 'get' | 'list' | 'saveDraft'>
  tools: Pick<Tools, 'list' | 'save' | 'addVersion'>
  project: (scope: InProject) => Promise<{
    project: { id: ProjectId; name: string }
    offered: readonly OfferedConnection[]
    app: { tables: AppTable[] } | null
  }>
  automations: (scope: InProject) => Promise<{ id: AutomationId; name: string; prompt: string }[]>
  test: (scope: InProject, agentId: AgentId, question: string) => Promise<TestedResult>
  log: FailureLog
}

const Search = z.object({ query: z.string().trim().max(200).optional() })
const Read = z.object({ agentId: AgentId })
const Test = z.object({ agentId: AgentId, question: z.string().trim().min(1).max(2000) })
const Change = DraftPatch.extend({ agentId: AgentId })
/** A tool's input is one object for the model; `toolId` tells a new version from a new tool. */
const Save = ToolVersionConfig.extend({
  toolId: ToolId.optional(),
  slug: ToolSlug.optional(),
  connectionId: ConnectionId.optional(),
  operation: OperationId.optional(),
})

function matches(query: string | undefined, ...texts: string[]): boolean {
  const wanted = query?.toLowerCase()
  return wanted === undefined || texts.some((text) => text.toLowerCase().includes(wanted))
}

/**
 * The refusal a service gave, as the result the model reads (code C21), with the field it names;
 * a failure of ours that is no refusal of the model's (`INTERNAL_UNEXPECTED`) stays an exception.
 */
function refused(deps: ConstrutorDeps, error: unknown): Refused {
  if (!(error instanceof Failure) || error.code === 'INTERNAL_UNEXPECTED') throw error
  logFailure(deps.log, error)
  const { field } = error.named
  return { kind: 'REFUSED', code: error.code, ...(field === undefined ? {} : { field }) }
}

/** The attempt key of a step: the id of the tool call, so a repeated step finds what it made. */
function keyOf(context: Pick<ToolExecutionContext, 'agent'>): string {
  const key = context.agent?.toolCallId
  if (key === undefined) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: { reason: 'CONSTRUTOR_TOOL_WITHOUT_CALL' },
    })
  }
  return key
}

/** The draft as saved, or the refusal, as what an agent tool answers (`ConstrutorResult`). */
async function saved(deps: ConstrutorDeps, work: () => Promise<AgentDetail>) {
  try {
    return { kind: 'SAVED', agent: await work() } as const
  } catch (error) {
    return refused(deps, error)
  }
}

function projectRead(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.projectRead,
    description:
      'Reads this Project: its name, the connections it received with what each reads, whether it has an app and the tables of the app (names and columns, never a row), and its agents with their state.',
    inputSchema: z.object({}),
    execute: async () =>
      ({
        ...(await deps.project(scope)),
        agents: await deps.agents.list(scope),
      }) satisfies Omit<ProjectReadResult, 'offered'> & { offered: readonly OfferedConnection[] },
  })
}

function toolSearch(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.toolSearch,
    description:
      'Searches the company library for tools this Project can use, by slug and description, the ready reads of its connections not yet in the library, and the Project’s automations. Always search before making a tool.',
    inputSchema: Search,
    execute: async ({ query }) => {
      const { tools, ready } = await deps.tools.list(scope)
      return {
        tools: tools.filter((each: ToolSummary) => matches(query, each.slug, each.description)),
        ready: ready.filter((each: ReadyTool) => matches(query, each.slug, each.summary)),
        automations: (await deps.automations(scope)).filter((each) =>
          matches(query, each.name, each.prompt),
        ),
      } satisfies ToolSearchResult
    },
  })
}

function toolSave(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.toolSave,
    description:
      'Saves a read tool in the library. Without toolId it makes a new tool (slug, connectionId, operation, description, bound, open); with toolId it saves that tool’s next version (description, bound, open). A tool never changes an agent already published.',
    inputSchema: Save,
    execute: async (input, context) => {
      const key = keyOf(context)
      const { toolId, slug, connectionId, operation, ...config } = input
      try {
        if (toolId !== undefined) {
          const tool = await deps.tools.addVersion(scope, toolId, config, key, 'CONSTRUTOR')
          return { kind: 'SAVED', tool } as const
        }
        const body = ToolInput.safeParse({ slug, connectionId, operation, ...config })
        if (!body.success) {
          const field = String(body.error.issues[0]?.path[0] ?? '')
          return { kind: 'REFUSED', code: 'REQUEST_MALFORMED', field } as const
        }
        return {
          kind: 'SAVED',
          tool: await deps.tools.save(scope, body.data, key, 'CONSTRUTOR'),
        } as const
      } catch (error) {
        return refused(deps, error)
      }
    },
  })
}

function agentRead(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.agentRead,
    description:
      'Reads an agent of this Project: its draft with the revision, the tools it chose (each with its version and the library’s latest) and what the Project offers.',
    inputSchema: Read,
    execute: ({ agentId }) => saved(deps, () => deps.agents.get(scope, agentId)),
  })
}

function agentDraft(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.agentDraft,
    description:
      'Creates an agent of this Project as a draft with a name and what it does. Nothing is published.',
    inputSchema: CreateAgent,
    execute: (input, context) => {
      const key = keyOf(context)
      return saved(deps, () => deps.agents.create(scope, input, key))
    },
  })
}

function agentSet(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.agentSet,
    description:
      'Changes the fields sent of an agent’s draft at the revision you read. On AGENT_DRAFT_STALE the answer carries the current draft: save again over it.',
    inputSchema: Change,
    execute: async ({ agentId, ...patch }) => {
      const answer = await saved(deps, () =>
        deps.agents.saveDraft(scope, agentId, patch, 'CONSTRUTOR'),
      )
      if (answer.kind === 'REFUSED' && answer.code === 'AGENT_DRAFT_STALE') {
        return { ...answer, current: await deps.agents.get(scope, agentId) }
      }
      return answer
    },
  })
}

function agentTest(deps: ConstrutorDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.agentTest,
    description:
      'Asks the agent’s draft one question and returns its answer and the tools it called. Nothing is kept.',
    inputSchema: Test,
    execute: ({ agentId, question }) => deps.test(scope, agentId, question),
  })
}

/**
 * The Construtor's tools, bound to the person and the Projeto of the conversation, never to what
 * the model says (code C23). Each writes through the U1 services, so a refusal is theirs, and
 * none publishes or writes in a company's system.
 */
export function construtorTools(deps: ConstrutorDeps, scope: InProject): ToolsInput {
  return {
    [CONSTRUTOR_TOOL.projectRead]: projectRead(deps, scope),
    [CONSTRUTOR_TOOL.toolSearch]: toolSearch(deps, scope),
    [CONSTRUTOR_TOOL.toolSave]: toolSave(deps, scope),
    [CONSTRUTOR_TOOL.agentRead]: agentRead(deps, scope),
    [CONSTRUTOR_TOOL.agentDraft]: agentDraft(deps, scope),
    [CONSTRUTOR_TOOL.agentSet]: agentSet(deps, scope),
    [CONSTRUTOR_TOOL.agentTest]: agentTest(deps, scope),
  }
}
