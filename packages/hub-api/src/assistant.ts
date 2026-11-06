import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import { CONNECTIONS_MAX, ConnectionId } from './connectors.ts'
import { ConversationId, Effort, ModelChoice, ModelId } from './conversations.ts'
import type { FailureCode } from './failures.ts'
import { ProjectId } from './library-ids.ts'
import { MACHINE_FILE_FAILURES, MACHINE_TOOL, MachineFileQuery, SHOWN_TEXT_MAX } from './machine.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'

/** The Assistant's controller, as Mastra's routes name it (`/agent-controller/assistant/…`, step 24.1). */
export const ASSISTANT_CONTROLLER = 'assistant'

/** The Assistant's own tools, by name; the units after U2 add theirs. */
export const ASSISTANT_TOOL = {
  overview: 'conexus_overview',
  showFile: MACHINE_TOOL.showFile,
  proposeApp: 'propose_app',
  proposeAppChange: 'propose_app_change',
  proposeAutomation: 'propose_automation',
} as const

/** An automation's id: Mastra's schedule id of the row (`schedule_<slug>`), its uuid derived from the creation's attempt (step 24.2). */
export const AutomationId = z
  .string()
  .regex(
    /^schedule_conexus-automation-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  )
  .brand('AutomationId')
export type AutomationId = z.infer<typeof AutomationId>

/** The automation whose run opened the conversation, with its name at that run; kept after the automation goes. */
const OpenedBy = z.object({ automationId: AutomationId, name: z.string() }).nullable()

const ConversationHead = z.object({
  id: ConversationId,
  title: z.string().nullable(),
  updatedAt: z.iso.datetime(),
})

/**
 * A conversation in the person's list: its Projeto with the name the row shows, or none when it
 * was born in the company. A Projeto no longer live has no name to show, so it reads as none.
 */
export const AssistantConversationSummary = ConversationHead.extend({
  project: z.object({ id: ProjectId, name: z.string() }).nullable(),
  automation: OpenedBy,
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

export const AssistantConversation = ConversationHead.extend({
  projectId: ProjectId.nullable(),
  automation: OpenedBy,
  connections: z.array(SessionConnection),
})
export type AssistantConversation = z.infer<typeof AssistantConversation>

/** The file of a conversation's machine, as a download: `GET`, the bytes with their type, for the owner alone. */
export function assistantFilePath(ids: {
  companyId: string
  conversationId: string
  path: string
}): string {
  const url = ASSISTANT_FILE.url
    .replace(':companyId', encodeURIComponent(ids.companyId))
    .replace(':conversationId', encodeURIComponent(ids.conversationId))
  return `${url}?${new URLSearchParams({ path: ids.path })}`
}

/**
 * What a connection read answers the screen, as Mastra stored it: the cut the model read, never the
 * whole answer. `value` is a list in `linhas` or something else; `complete` is false when the cut
 * took rows or text away; `empty` is the provider's own word that nothing matched.
 */
export const ReadCut = z.object({
  kind: z.literal('OK'),
  value: z.unknown().optional(),
  complete: z.boolean().optional(),
  empty: z.boolean().optional(),
})
export type ReadCut = z.infer<typeof ReadCut>

/** A read's value that is a list of rows. */
export const ReadRows = z.looseObject({ linhas: z.array(z.unknown()) })

/** A read the provider asked to wait for, with the wait it named. */
export const ReadBusy = z.object({ kind: z.literal('BUSY'), waitMs: z.number().nullable() })

const Summary = z.string().min(1).max(4000)

/** What the model gives `propose_app` and `propose_app_change` (step 24.3.2): the plan is a file, never the chat's text. */
export const ProposeAppInput = z.object({
  summary: Summary.describe(
    'A few lines the person reads on the button: who uses the app, what they record or see, which systems it reads.',
  ),
  briefing: z.string().min(1).max(500).describe('The path of the briefing file you wrote.'),
})
export type ProposeAppInput = z.infer<typeof ProposeAppInput>

/** The briefing as the tool read it when it ran, kept with the call: the machine may be gone at the touch. */
export const Briefing = z.object({ name: z.string(), content: z.string().max(SHOWN_TEXT_MAX) })
export type Briefing = z.infer<typeof Briefing>

/**
 * What `propose_app` (Início, **Criar app**) and `propose_app_change` (a Projeto, **Mandar ao
 * Builder**) answer: the need, summarized, and its briefing. Mastra keeps each output as stored, so
 * a proposal stored before step 24.3.2 has no briefing.
 */
export const ProposedApp = z.object({ summary: Summary, briefing: Briefing.optional() })
export type ProposedApp = z.infer<typeof ProposedApp>

/** Why a proposal was not made: the model writes the briefing again and calls again. */
export const ProposeRefused = z.object({
  kind: z.literal('PROPOSE_REFUSED'),
  reason: z.enum(['OUTSIDE', 'NOT_FOUND', 'NOT_TEXT', 'TOO_LARGE', 'MACHINE_UNAVAILABLE']),
})
export type ProposeRefused = z.infer<typeof ProposeRefused>

/** What `conexus_overview` answers (code C21: a list per kind of thing, no free text). */
export type Overview = {
  projects: readonly {
    projectId: ProjectId
    name: string
    app: { kind: 'PUBLISHED'; version: string } | { kind: 'NOT_PUBLISHED' }
  }[]
  /** The company has more live Projetos than the page `projects` holds. */
  moreProjects: boolean
  connections: readonly SessionConnection[]
}

const InCompany = z.object({ companyId: CompanyId })
const OfConversation = InCompany.extend({ conversationId: ConversationId })
const Chosen = z.array(ConnectionId).max(CONNECTIONS_MAX)
const BASE = '/api/companies/{companyId}/assistant/conversations'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]

/** The longest text a person searches the conversation titles for. */
export const CONVERSATION_SEARCH_MAX = 100

export const listAssistantConversations = defineOperation({
  id: 'listAssistantConversations',
  summary:
    'Lists the person’s own conversations with the Assistant, newest first, all of them or those of one Projeto, one place (Início or Automações) or whose title holds a text, without accent or case.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: {
    params: InCompany,
    query: Page.extend({
      projectId: ProjectId.optional(),
      q: z.string().trim().min(1).max(CONVERSATION_SEARCH_MAX).optional(),
      place: z.enum(['HOME', 'AUTOMATIONS']).optional(),
    }),
  },
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

export const setAssistantModel = defineOperation({
  id: 'setAssistantModel',
  summary: 'Changes the model of an Assistant conversation and its effort, for its next answers.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{conversationId}/model`,
  bodyLimit: 1024,
  input: { params: OfConversation, body: ModelChoice },
  success: { status: 200, body: ModelChoice },
  failures: [
    ...READ_FAILURES,
    'CONVERSATION_NOT_FOUND',
    'MODEL_UNKNOWN',
    'MODEL_NO_ACCOUNT',
    'EFFORT_UNSUPPORTED',
  ],
})

/** The longest title a person gives a conversation. */
export const CONVERSATION_TITLE_MAX = 120

export const renameAssistantConversation = defineOperation({
  id: 'renameAssistantConversation',
  summary:
    'Gives an Assistant conversation the title its person chose; the title stays, and the memory no longer replaces it.',
  access: 'session',
  method: 'PATCH',
  path: `${BASE}/{conversationId}`,
  bodyLimit: 1024,
  input: {
    params: OfConversation,
    body: z.object({ title: z.string().trim().min(1).max(CONVERSATION_TITLE_MAX) }),
  },
  success: { status: 200, body: z.object({ title: z.string() }) },
  failures: [...READ_FAILURES, 'CONVERSATION_NOT_FOUND'],
})

export const deleteAssistantConversation = defineOperation({
  id: 'deleteAssistantConversation',
  summary:
    'Deletes one of the person’s own Assistant conversations: its answer stops, its machine is killed, its messages and files go. The Projeto, its app and its versions stay.',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/{conversationId}`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 204 },
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
  query: MachineFileQuery,
  failures: [
    ...READ_FAILURES,
    'REQUEST_MALFORMED',
    'REQUEST_ORIGIN_REFUSED',
    'CONVERSATION_NOT_FOUND',
    ...MACHINE_FILE_FAILURES,
  ] as const satisfies readonly FailureCode[],
}
