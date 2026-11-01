import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { ConversationId, Effort, ModelId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/** The Assistant's controller, as Mastra's routes name it (`/agent-controller/assistant/…`, step 24.1). */
export const ASSISTANT_CONTROLLER = 'assistant'

/** The Assistant's own tools, by name; the units after U2 add theirs. */
export const ASSISTANT_TOOL = { overview: 'conexus_overview' } as const

/** The most connections a conversation may choose at once. */
const CHOSEN_MAX = 50

export const AssistantConversationSummary = z.object({
  id: ConversationId,
  title: z.string().nullable(),
  updatedAt: z.iso.datetime(),
  projectId: ProjectId.nullable(),
})
export type AssistantConversationSummary = z.infer<typeof AssistantConversationSummary>

/** A connection the conversation's place offers, and whether the conversation chose it. */
export const SessionConnection = z.object({
  connectionId: ConnectionId,
  connector: z.string(),
  name: z.string(),
  chosen: z.boolean(),
})
export type SessionConnection = z.infer<typeof SessionConnection>

export const AssistantConversation = AssistantConversationSummary.extend({
  connections: z.array(SessionConnection),
})
export type AssistantConversation = z.infer<typeof AssistantConversation>

/** What `conexus_overview` answers (code C21: a list per kind of thing, no free text). */
export type Overview = {
  projects: readonly {
    projectId: ProjectId
    name: string
    app: { kind: 'PUBLISHED'; version: string } | { kind: 'NOT_PUBLISHED' }
  }[]
  connections: readonly SessionConnection[]
}

const InCompany = z.object({ companyId: CompanyId })
const OfConversation = InCompany.extend({ conversationId: ConversationId })
const Chosen = z.array(ConnectionId).max(CHOSEN_MAX)
const BASE = '/api/companies/{companyId}/assistant/conversations'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

export const listAssistantConversations = defineOperation({
  id: 'listAssistantConversations',
  summary:
    'Lists the person’s own conversations with the Assistant, newest first, all of them or those of one Projeto.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany, query: Page.extend({ projectId: ProjectId.optional() }) },
  success: {
    status: 200,
    body: z.object({ conversations: z.array(AssistantConversationSummary), next: Next }),
  },
  failures: READ_FAILURES,
})

export const createAssistantConversation = defineOperation({
  id: 'createAssistantConversation',
  summary: `Starts a conversation of the person with the Assistant, keyed by ${ATTEMPT_KEY_HEADER}, in the company or in one of its Projetos, with the connections it chose and the model chosen or the company’s default.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 4096,
  input: {
    params: InCompany,
    body: z.object({
      model: ModelId.optional(),
      effort: Effort.optional(),
      projectId: ProjectId.optional(),
      connections: Chosen,
    }),
  },
  attemptKey: true,
  success: {
    status: 201,
    body: z.object({ conversation: AssistantConversation.extend({ model: ModelId }) }),
  },
  failures: [
    ...READ_FAILURES,
    'IDEMPOTENCY_CONFLICT',
    'MODEL_UNKNOWN',
    'MODEL_NO_ACCOUNT',
    'EFFORT_UNSUPPORTED',
  ],
})

export const readAssistantConversation = defineOperation({
  id: 'readAssistantConversation',
  summary:
    'Reads one of the person’s conversations with the Assistant: its title, its Projeto and each connection its place offers, chosen or not.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{conversationId}`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 200, body: z.object({ conversation: AssistantConversation }) },
  failures: [...READ_FAILURES, 'CONVERSATION_NOT_FOUND'],
})

export const setAssistantConnections = defineOperation({
  id: 'setAssistantConnections',
  summary:
    'Changes the connections a conversation with the Assistant reads, for its next answers; keeps only those its place offers.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{conversationId}/connections`,
  bodyLimit: 4096,
  input: { params: OfConversation, body: z.object({ connections: Chosen }) },
  success: { status: 200, body: z.object({ conversation: AssistantConversation }) },
  failures: [...READ_FAILURES, 'CONVERSATION_NOT_FOUND'],
})

export const listAssistantConnections = defineOperation({
  id: 'listAssistantConnections',
  summary:
    'Lists the connections a new conversation with the Assistant may choose, in the company or in one of its Projetos.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/assistant/connections',
  bodyLimit: 1024,
  input: { params: InCompany, query: z.object({ projectId: ProjectId.optional() }) },
  success: { status: 200, body: z.object({ connections: z.array(SessionConnection) }) },
  failures: READ_FAILURES,
})
