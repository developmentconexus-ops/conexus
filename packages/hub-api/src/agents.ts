import { z } from 'zod'
import { AgentId, ToolId, ToolVersionId } from './agent-ids.ts'
import { CompanyId } from './companies.ts'
import { CONNECTIONS_MAX, ConnectionId, OfferedRead } from './connectors.ts'
import { ConversationId, ModelId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { PersonId } from './identity.ts'
import { ProjectId } from './library-ids.ts'
import { MACHINE_FILE_FAILURES, MachineFileQuery } from './machine.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import {
  APP_DATA_TOOL,
  CodeVersionDetail,
  LatestVersion,
  PresetVersionDetail,
  ToolApproval,
  ToolEffect,
  ToolSlug,
  ToolTarget,
} from './tools.ts'

/** An automation's limit: the same line in the lists. */
export const AGENT_NAME_MAX = 80
/** Twice an automation's prompt, as the card sets it. */
export const AGENT_INSTRUCTIONS_MAX = 8000
export const AGENT_DESCRIPTION_MAX = 280

export const AgentMemory = z.object({ observational: z.boolean() })

/** An agent's configuration (step 24.3), the draft's and each published version's, field by field Mastra's own version shape. */
export const AgentConfig = z.object({
  name: z.string().trim().min(1).max(AGENT_NAME_MAX),
  description: z.string().trim().max(AGENT_DESCRIPTION_MAX),
  /** Empty only in a draft: publishing needs instructions (`AGENT_DRAFT_INVALID`). */
  instructions: z.string().max(AGENT_INSTRUCTIONS_MAX),
  /** `null`: the model of whoever converses with the agent. */
  model: ModelId.nullable(),
  memory: AgentMemory,
  /**
   * The Projeto's connections the agent selected (decision E4): each gives no read; the reads are
   * the chosen tools'. A tool's connection is always among them.
   */
  connections: z
    .array(ConnectionId)
    .max(CONNECTIONS_MAX)
    .refine((ids) => new Set(ids).size === ids.length),
  web: z.boolean(),
  appData: z.boolean(),
  /**
   * Whether the version was written with the reads as chosen tools (decision E4). A version
   * written before reads `connections` as the kit's typed reads of each connection.
   */
  byTool: z.boolean().default(false),
  /** The agent's Computador (step 24.4): a machine of its own per conversation. A version published before it reads as off. */
  machine: z.boolean().default(false),
})
export type AgentConfig = z.infer<typeof AgentConfig>

export const CreateAgent = z.object({
  name: AgentConfig.shape.name,
  description: AgentConfig.shape.description.optional(),
})
export type CreateAgent = z.infer<typeof CreateAgent>

/**
 * A change of the draft at the revision the writer read (code C38). `tools` replaces the chosen
 * versions whole; `ready` adds ready reads, which the service saves in the library first.
 */
export const DraftPatch = AgentConfig.omit({ machine: true, byTool: true })
  .partial()
  .extend({
    /** Absent keeps the draft's Computador; the default of `AgentConfig` is for reading an old version only. */
    machine: z.boolean().optional(),
    revision: z.int().positive(),
    tools: z
      .array(ToolVersionId)
      .refine((ids) => new Set(ids).size === ids.length)
      .optional(),
    ready: z.array(ToolTarget).max(CONNECTIONS_MAX).optional(),
    approvals: z.record(ToolId, ToolApproval).optional(),
  })
export type DraftPatch = z.infer<typeof DraftPatch>

export const Publish = z.object({
  revision: z.int().positive(),
  message: z.string().trim().max(AGENT_DESCRIPTION_MAX),
})
export type Publish = z.infer<typeof Publish>

/** Never published, or a version is active; `changed` says the draft moved past it (code C21). */
export const AgentState = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DRAFT') }),
  z.object({ kind: z.literal('PUBLISHED'), version: z.int().positive(), changed: z.boolean() }),
])
export type AgentState = z.infer<typeof AgentState>

const Author = z.object({ personId: PersonId, name: z.string() }).nullable()

export const AgentSummary = z.object({
  id: AgentId,
  projectId: ProjectId,
  name: z.string(),
  description: z.string(),
  state: AgentState,
  updatedAt: z.iso.datetime(),
  /** The start of the last turn with the published version, by anyone; `null`: never ran published. */
  lastRunAt: z.iso.datetime().nullable(),
})
export type AgentSummary = z.infer<typeof AgentSummary>

/** A row of the list: the summary and how many tools the draft holds. */
export const AgentListed = AgentSummary.extend({ tools: z.int().nonnegative() })
export type AgentListed = z.infer<typeof AgentListed>

/** A chosen tool: the version the draft holds, and the newest of the library. */
const ChosenBase = { id: ToolId, slug: ToolSlug, effect: ToolEffect, latest: LatestVersion }
export const AgentTool = z.discriminatedUnion('kind', [
  ToolTarget.extend({
    ...ChosenBase,
    kind: z.literal('PRESET'),
    version: PresetVersionDetail,
    approval: ToolApproval.optional(),
  }),
  z.object({
    ...ChosenBase,
    kind: z.literal('CODE'),
    connectionId: ConnectionId,
    version: CodeVersionDetail,
  }),
])
export type AgentTool = z.infer<typeof AgentTool>

/** A connection the Projeto offers now, with its reads and its writes, for the panel to choose from. */
export const OfferedConnection = z.object({
  connectionId: ConnectionId,
  connector: z.string(),
  name: z.string(),
  reads: z.array(OfferedRead),
  writes: z.array(OfferedRead),
})
export type OfferedConnection = z.infer<typeof OfferedConnection>

export const AgentDetail = AgentSummary.extend({
  draft: AgentConfig,
  revision: z.int().positive(),
  tools: z.array(AgentTool),
  offered: z.array(OfferedConnection),
  createdBy: Author,
})
export type AgentDetail = z.infer<typeof AgentDetail>

export const AgentVersionSummary = z.object({
  number: z.int().positive(),
  message: z.string(),
  active: z.boolean(),
  publishedAt: z.iso.datetime(),
  publishedBy: Author,
})
export type AgentVersionSummary = z.infer<typeof AgentVersionSummary>

/** The key of the agents' controller in Mastra's routes (`/agent-controller/agents/…`), step 24.3. */
export const AGENTS_CONTROLLER = 'agents'

/** The tools of an agent that are not a tool of the company's library: the name the model reads (step 24.3, U3). */
export const AGENT_TOOL = { appDataRead: APP_DATA_TOOL.read } as const

/** A conversation of the person's with an agent: with its published version, or the test one with its draft. */
export const AgentConversationSummary = z.object({
  id: ConversationId,
  agentId: AgentId,
  draft: z.boolean(),
  title: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type AgentConversationSummary = z.infer<typeof AgentConversationSummary>

const InCompany = z.object({ companyId: CompanyId })
const InProject = InCompany.extend({ projectId: ProjectId })
const OfAgent = InProject.extend({ agentId: AgentId })
const BASE = '/api/companies/{companyId}/projects/{projectId}/agents'
const READ_FAILURES = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const
const ONE_FAILURES = [...READ_FAILURES, 'AGENT_NOT_FOUND'] as const
const NOT_HELD = ['NOT_IN_ROLE', 'AGENT_TOOL_REFUSED'] as const
const OneAgent = z.object({ agent: AgentDetail })
/** A version's number as the path carries it. */
const PathNumber = z
  .string()
  .regex(/^[1-9][0-9]{0,8}$/)
  .transform(Number)

export const listAgents = defineOperation({
  id: 'listAgents',
  summary:
    'Lists the agents of one Projeto of the company, or of all its live Projetos without `projectId`.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/agents',
  bodyLimit: 1024,
  input: { params: InCompany, query: z.object({ projectId: ProjectId.optional() }) },
  success: { status: 200, body: z.object({ agents: z.array(AgentListed) }) },
  failures: READ_FAILURES,
})

export const createAgent = defineOperation({
  id: 'createAgent',
  summary: `Creates an agent of the Projeto as a draft with the default configuration, keyed by ${ATTEMPT_KEY_HEADER}.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 4096,
  input: { params: InProject, body: CreateAgent },
  attemptKey: true,
  success: { status: 201, body: OneAgent },
  failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT'],
})

export const getAgent = defineOperation({
  id: 'getAgent',
  summary:
    'Reads one agent of the Projeto: its draft, its chosen tools and what the Projeto offers.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{agentId}`,
  bodyLimit: 1024,
  input: { params: OfAgent },
  success: { status: 200, body: OneAgent },
  failures: ONE_FAILURES,
})

export const saveAgentDraft = defineOperation({
  id: 'saveAgentDraft',
  summary: 'Changes an agent’s draft at the revision read: fields, tools and approvals.',
  access: 'session',
  method: 'PATCH',
  path: `${BASE}/{agentId}/draft`,
  bodyLimit: 65_536,
  input: { params: OfAgent, body: DraftPatch },
  success: { status: 200, body: OneAgent },
  failures: [
    ...ONE_FAILURES,
    'AGENT_DRAFT_STALE',
    'TOOL_REFUSED',
    'REQUEST_MALFORMED',
    ...NOT_HELD,
  ],
})

export const publishAgent = defineOperation({
  id: 'publishAgent',
  summary:
    'Freezes the draft of the revision read as the agent’s next version, with the version of each tool, and makes it active.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{agentId}/publish`,
  bodyLimit: 4096,
  input: { params: OfAgent, body: Publish },
  success: {
    status: 200,
    body: z.object({ agent: AgentDetail, version: AgentVersionSummary }),
  },
  failures: [...ONE_FAILURES, 'AGENT_DRAFT_INVALID', 'AGENT_DRAFT_STALE', ...NOT_HELD],
})

export const listAgentVersions = defineOperation({
  id: 'listAgentVersions',
  summary: 'Lists the published versions of an agent, newest first, and which one is active.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{agentId}/versions`,
  bodyLimit: 1024,
  input: { params: OfAgent },
  success: { status: 200, body: z.object({ versions: z.array(AgentVersionSummary) }) },
  failures: ONE_FAILURES,
})

export const activateAgentVersion = defineOperation({
  id: 'activateAgentVersion',
  summary: 'Makes one published version of an agent the active one; the draft does not change.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{agentId}/versions/{number}/activate`,
  bodyLimit: 1024,
  input: { params: OfAgent.extend({ number: PathNumber }) },
  success: { status: 200, body: OneAgent },
  failures: [...ONE_FAILURES, 'AGENT_VERSION_NOT_FOUND', ...NOT_HELD],
})

export const deleteAgent = defineOperation({
  id: 'deleteAgent',
  summary:
    'Deletes an agent, its versions and its choices of tools; the tools stay in the library.',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/{agentId}`,
  bodyLimit: 1024,
  input: { params: OfAgent },
  success: { status: 204 },
  failures: ONE_FAILURES,
})

export const createAgentConversation = defineOperation({
  id: 'createAgentConversation',
  summary: `Opens a conversation of the person's with the agent's published version, or with its draft (\`draft\`), keyed by ${ATTEMPT_KEY_HEADER}.`,
  access: 'session',
  method: 'POST',
  path: `${BASE}/{agentId}/conversations`,
  bodyLimit: 1024,
  input: { params: OfAgent, body: z.object({ draft: z.boolean().optional() }) },
  attemptKey: true,
  success: { status: 201, body: z.object({ conversation: AgentConversationSummary }) },
  failures: [
    ...ONE_FAILURES,
    'AGENT_NOT_PUBLISHED',
    'IDEMPOTENCY_CONFLICT',
    'MODEL_UNKNOWN',
    'MODEL_NO_ACCOUNT',
    'EFFORT_UNSUPPORTED',
  ],
})

export const listAgentConversations = defineOperation({
  id: 'listAgentConversations',
  summary: "Lists the person's own conversations with the agent, newest first.",
  access: 'session',
  method: 'GET',
  path: `${BASE}/{agentId}/conversations`,
  bodyLimit: 1024,
  input: { params: OfAgent },
  success: { status: 200, body: z.object({ conversations: z.array(AgentConversationSummary) }) },
  failures: ONE_FAILURES,
})

/**
 * The file of an agent conversation's machine, as a download (step 24.4, U4): `GET`, the bytes with
 * their type, for the person who may read the conversation. The server registers it beside the
 * operations, as the Assistant's.
 */
export const AGENT_FILE = {
  url: '/api/companies/:companyId/agents/conversations/:conversationId/files',
  params: InCompany.extend({ conversationId: ConversationId }),
  query: MachineFileQuery,
  failures: [
    ...READ_FAILURES,
    'REQUEST_MALFORMED',
    'REQUEST_ORIGIN_REFUSED',
    'CONVERSATION_NOT_FOUND',
    ...MACHINE_FILE_FAILURES,
  ] as const satisfies readonly FailureCode[],
}

/** The URL a download of the agent conversation's file is fetched from. */
export function agentFilePath(ids: {
  companyId: string
  conversationId: string
  path: string
}): string {
  const url = AGENT_FILE.url
    .replace(':companyId', encodeURIComponent(ids.companyId))
    .replace(':conversationId', encodeURIComponent(ids.conversationId))
  return `${url}?${new URLSearchParams({ path: ids.path })}`
}
