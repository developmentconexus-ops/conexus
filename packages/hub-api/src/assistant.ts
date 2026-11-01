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
export const ASSISTANT_TOOL = {
  overview: 'conexus_overview',
  showFile: 'show_file',
  proposeApp: 'propose_app',
} as const

/** The most connections a conversation may choose at once. */
const CHOSEN_MAX = 50

/** An automation's id: Mastra's schedule id of the row (`schedule_<slug>`), its uuid derived from the creation's attempt (step 24.2). */
export const AutomationId = z
  .string()
  .regex(
    /^schedule_conexus-automation-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  )
  .brand('AutomationId')
export type AutomationId = z.infer<typeof AutomationId>

export const AssistantConversationSummary = z.object({
  id: ConversationId,
  title: z.string().nullable(),
  updatedAt: z.iso.datetime(),
  projectId: ProjectId.nullable(),
  /** The automation whose run opened the conversation, with its name at that run; kept after the automation goes. */
  automation: z.object({ automationId: AutomationId, name: z.string() }).nullable(),
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

/** The most a text file shown beside the chat carries in its output: a larger one is a file to download. */
export const SHOWN_TEXT_MAX = 65_536

export const ShowFileInput = z.object({ path: z.string().min(1).max(500) })

/** What `show_file` answers the screen: the text to read, a file to download, or why nothing is shown. */
export const ShownFile = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('TEXT'),
    path: z.string(),
    name: z.string(),
    media: z.enum(['text/markdown', 'text/plain', 'text/csv']),
    content: z.string().max(SHOWN_TEXT_MAX),
  }),
  z.object({
    kind: z.literal('FILE'),
    path: z.string(),
    name: z.string(),
    media: z.string(),
    bytes: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal('SHOW_REFUSED'),
    reason: z.enum(['OUTSIDE', 'NOT_FOUND', 'MACHINE_UNAVAILABLE']),
  }),
])
export type ShownFile = z.infer<typeof ShownFile>

/** The file of a conversation's machine, as a download: `GET`, the bytes with their type, for the owner alone. */
export function assistantFilePath(ids: {
  companyId: string
  conversationId: string
  path: string
}): string {
  return `/api/companies/${ids.companyId}/assistant/conversations/${ids.conversationId}/files?${new URLSearchParams({ path: ids.path })}`
}

/** What `propose_app` answers: the request, summarized, that **Criar app** hands to the Builder of a new Projeto. */
export const ProposedApp = z.object({ summary: z.string().min(1).max(4000) })
export type ProposedApp = z.infer<typeof ProposedApp>

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

/**
 * The route that gives the bytes of a file of the conversation's machine, `GET` with the file's
 * `path` in the query, to the conversation's owner alone. It answers bytes, which an operation
 * (JSON bodies) does not declare: the server registers it beside the operations.
 */
export const ASSISTANT_FILE = {
  url: '/api/companies/:companyId/assistant/conversations/:conversationId/files',
  params: OfConversation,
  query: z.object({ path: z.string().min(1).max(500) }),
  failures: [
    ...READ_FAILURES,
    'REQUEST_MALFORMED',
    'REQUEST_ORIGIN_REFUSED',
    'CONVERSATION_NOT_FOUND',
    'FILE_NOT_FOUND',
    'FILE_TOO_LARGE',
    'FILE_GONE',
    'MACHINE_UNAVAILABLE',
  ] as const satisfies readonly FailureCode[],
}
