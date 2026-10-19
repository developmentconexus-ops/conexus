import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

export const ConversationId = z.uuid().brand('ConversationId')
export type ConversationId = z.infer<typeof ConversationId>

/** The longest message a person sends the Builder, in characters. */
export const MESSAGE_MAX_LENGTH = 20_000
/** A model of the router's registry, such as `anthropic/claude-sonnet-4-5` (decision 0049). */
const ModelName = z.string().min(1).max(200)

/** A piece of a message: its text, a page the Builder read, or a notice of the account queue. */
export const MessagePart = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('page'), url: z.url(), title: z.string().nullable() }),
  z.object({ type: z.literal('notice'), text: z.string() }),
])
export type MessagePart = z.infer<typeof MessagePart>

export const Message = z.object({
  id: z.string().min(1),
  role: z.enum(['person', 'builder']),
  parts: z.array(MessagePart),
  createdAt: z.iso.datetime(),
})
export type Message = z.infer<typeof Message>

export const ConversationSummary = z.object({
  id: ConversationId,
  title: z.string().nullable(),
  createdAt: z.iso.datetime(),
})
export type ConversationSummary = z.infer<typeof ConversationSummary>

export const Conversation = ConversationSummary.extend({
  model: ModelName,
  messages: z.array(Message),
})
export type Conversation = z.infer<typeof Conversation>

/**
 * What the stream of a conversation says. `turn` comes first on a reconnect, the answer in
 * progress so far; `turnEnd` ends each answer, and `failure` comes before it when the turn failed.
 */
export const ConversationEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('turn'), message: Message }),
  z.object({ type: z.literal('text'), delta: z.string() }),
  z.object({ type: z.literal('part'), part: MessagePart }),
  z.object({ type: z.literal('notice'), text: z.string() }),
  z.object({ type: z.literal('title'), title: z.string() }),
  z.object({ type: z.literal('turnEnd'), reason: z.enum(['complete', 'aborted', 'error']) }),
  z.object({
    type: z.literal('failure'),
    code: z.enum(['MODEL_NO_ACCOUNT', 'MODEL_CALL_FAILED', 'INTERNAL_UNEXPECTED']),
  }),
])
export type ConversationEvent = z.infer<typeof ConversationEvent>

/** How often the stream says it is alive, so a proxy keeps it open. */
export const CONVERSATION_HEARTBEAT_MS = 25_000

const InProject = z.object({ companyId: CompanyId, projectId: ProjectId })
const OfConversation = InProject.extend({ conversationId: ConversationId })
const BASE = '/api/companies/{companyId}/projects/{projectId}/conversations'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
  'CONVERSATION_NOT_FOUND',
] as const satisfies readonly FailureCode[]

export const listConversations = defineOperation({
  id: 'listConversations',
  summary: 'Lists the person’s own conversations of a Projeto, newest first.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject, query: Page },
  success: {
    status: 200,
    body: z.object({ conversations: z.array(ConversationSummary), next: Next }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createConversation = defineOperation({
  id: 'createConversation',
  summary: `Starts a conversation of the person in a Projeto, keyed by ${ATTEMPT_KEY_HEADER}, on the model chosen or the company’s default.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject, body: z.object({ model: ModelName.optional() }) },
  attemptKey: true,
  success: {
    status: 201,
    body: z.object({ conversation: ConversationSummary.extend({ model: ModelName }) }),
  },
  failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT', 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT'],
})

export const readConversation = defineOperation({
  id: 'readConversation',
  summary: 'Reads one of the person’s conversations: its title, its model and its messages.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{conversationId}`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 200, body: z.object({ conversation: Conversation }) },
  failures: READ_FAILURES,
})

export const sendConversationMessage = defineOperation({
  id: 'sendConversationMessage',
  summary: 'Sends the Builder a message; its answer comes on the conversation’s stream.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{conversationId}/messages`,
  bodyLimit: 128 * 1024,
  input: {
    params: OfConversation,
    body: z.object({ content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH) }),
  },
  attemptKey: true,
  success: { status: 202 },
  failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT'],
})

export const streamConversation = defineOperation({
  id: 'streamConversation',
  summary: 'Streams a conversation: the answer in progress first, then each new event.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{conversationId}/events`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 200, events: ConversationEvent, heartbeatMs: CONVERSATION_HEARTBEAT_MS },
  failures: READ_FAILURES,
})

export const stopConversation = defineOperation({
  id: 'stopConversation',
  summary: 'Stops the answer in progress; the text so far stays in the conversation.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{conversationId}/stop`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: { status: 204 },
  failures: READ_FAILURES,
})

export const setConversationModel = defineOperation({
  id: 'setConversationModel',
  summary: 'Changes the model of a conversation, for its next answers.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{conversationId}/model`,
  bodyLimit: 1024,
  input: { params: OfConversation, body: z.object({ model: ModelName }) },
  success: { status: 200, body: z.object({ model: ModelName }) },
  failures: [...READ_FAILURES, 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT'],
})
