import { z } from 'zod'
import { AgentDetail, AgentListed, AgentSummary, OfferedConnection } from './agents.ts'
import { AutomationId } from './assistant.ts'
import { CompanyId } from './companies.ts'
import { ConversationId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { Problem } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'
import { ReadyTool, ToolSummary } from './tools.ts'

/** The key of the Construtor's controller in Mastra's routes (`/agent-controller/construtor/…`), step 24.3. */
export const CONSTRUTOR_CONTROLLER = 'construtor'

/** The Construtor's own tools; its connector and web tools are the Builder's and keep their names. */
export const CONSTRUTOR_TOOL = {
  projectRead: 'project_read',
  toolSearch: 'tool_search',
  toolSave: 'tool_save',
  agentRead: 'agent_read',
  agentDraft: 'agent_draft',
  agentSet: 'agent_set',
  agentTest: 'agent_test',
} as const

/** What agent_read, agent_draft and agent_set answer the model: the draft as saved, or the refusal (code C21). */
export const ConstrutorResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SAVED'), agent: AgentDetail }),
  z.object({
    kind: z.literal('REFUSED'),
    code: Problem.shape.code,
    field: z.string().optional(),
    /** On `AGENT_DRAFT_STALE`: the draft as it is now, to save over. */
    current: AgentDetail.optional(),
  }),
])
export type ConstrutorResult = z.infer<typeof ConstrutorResult>

/** What a screen needs of a draft the Construtor saved: which agent, by name; the live draft is read by its id. */
export const DraftRef = z.object({
  kind: z.literal('SAVED'),
  agent: AgentSummary.pick({ id: true, name: true }),
})
export type DraftRef = z.infer<typeof DraftRef>

/** What project_read answers the model: the Projeto, what it offers, its app's tables and its agents. */
export const ProjectReadResult = z.object({
  project: z.object({ id: ProjectId, name: z.string() }),
  offered: z.array(OfferedConnection),
  app: z
    .object({ tables: z.array(z.object({ name: z.string(), columns: z.array(z.string()) })) })
    .nullable(),
  agents: z.array(AgentListed),
})
export type ProjectReadResult = z.infer<typeof ProjectReadResult>

/** What tool_search answers the model: the library's tools, the ready reads and the automations that match. */
export const ToolSearchResult = z.object({
  tools: z.array(ToolSummary),
  ready: z.array(ReadyTool),
  automations: z.array(z.object({ id: AutomationId, name: z.string(), prompt: z.string() })),
})
export type ToolSearchResult = z.infer<typeof ToolSearchResult>

/** What agent_test answers the model: the draft's answer and the tools it called, or the refusal. */
export const TestedResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ANSWERED'), text: z.string(), tools: z.array(z.string()) }),
  z.object({ kind: z.literal('REFUSED'), code: Problem.shape.code, field: z.string().optional() }),
])
export type TestedResult = z.infer<typeof TestedResult>

/** A conversation of the person's with the Construtor, in one Projeto. */
export const ConstrutorConversationSummary = z.object({
  id: ConversationId,
  title: z.string(),
  updatedAt: z.iso.datetime(),
})
export type ConstrutorConversationSummary = z.infer<typeof ConstrutorConversationSummary>

const InProject = z.object({ companyId: CompanyId, projectId: ProjectId })
const BASE = '/api/companies/{companyId}/projects/{projectId}/construtor/conversations'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const createConstrutorConversation = defineOperation({
  id: 'createConstrutorConversation',
  summary: `Opens a conversation of the person's with the Construtor in the Projeto, keyed by ${ATTEMPT_KEY_HEADER}.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject, body: z.object({}) },
  attemptKey: true,
  success: { status: 201, body: z.object({ conversation: ConstrutorConversationSummary }) },
  failures: [
    ...READ_FAILURES,
    'IDEMPOTENCY_CONFLICT',
    'MODEL_UNKNOWN',
    'MODEL_NO_ACCOUNT',
    'EFFORT_UNSUPPORTED',
  ],
})

export const listConstrutorConversations = defineOperation({
  id: 'listConstrutorConversations',
  summary: "Lists the person's own conversations with the Construtor in the Projeto, newest first.",
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject },
  success: {
    status: 200,
    body: z.object({ conversations: z.array(ConstrutorConversationSummary) }),
  },
  failures: READ_FAILURES,
})
