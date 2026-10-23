import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation, LAST_EVENT_ID_HEADER } from './operation.ts'
import { ProjectId } from './projects.ts'
import { PlanPart, QuestionPart, TasksPart } from './questions.ts'
import { Subject, ToolDetail } from './tool-detail.ts'

export const ConversationId = z.uuid().brand('ConversationId')
export type ConversationId = z.infer<typeof ConversationId>

/**
 * Whether a saved version's app built (card of step 14): its check at the end of the turn passed,
 * failed the last time the turn could try, or could not run on the machine (founder, 2026-10-22,
 * the words of `CHECK_PLATFORM_FAILED`); or the turn ended with `open` tasks still open the last
 * time it could try, the version saved half done (card of step 14.2, criterion 15).
 */
export const VersionCheck = z.discriminatedUnion('state', [
  z.object({ state: z.literal('passed') }),
  z.object({ state: z.literal('unfinished'), open: z.int().positive() }),
  z.object({ state: z.literal('failed'), code: z.literal('APP_CHECK_FAILED') }),
  z.object({ state: z.literal('unchecked'), code: z.literal('CHECK_PLATFORM_FAILED') }),
])
export type VersionCheck = z.infer<typeof VersionCheck>

/** The longest message a person sends the Builder, in characters. */
export const MESSAGE_MAX_LENGTH = 20_000
/** A model of the router's registry, such as `anthropic/claude-sonnet-4-5` (decision 0049). */
export const ModelId = z.string().min(1).max(200).brand('ModelId')
export type ModelId = z.infer<typeof ModelId>

/** A model's provider, its name before the first slash as the router splits it, or null. */
export function providerOfModel(model: string): string | null {
  const slash = model.indexOf('/')
  return slash > 0 && slash < model.length - 1 ? model.slice(0, slash) : null
}

/** How hard the model reasons before it answers, the controller's `AgentControllerThinkingLevel`. */
export const EFFORTS = ['off', 'low', 'medium', 'high', 'xhigh', 'max'] as const
export const Effort = z.enum(EFFORTS)
export type Effort = z.infer<typeof Effort>

/**
 * The effort a model runs at for `effort`, given the efforts it accepts, lowest first: the same; or
 * for a level it lacks the nearest level below it, else its lowest level; `off` only where listed.
 * The Hub asks the provider by it and the screen names it, so the two never differ.
 */
export function runningEffort(efforts: readonly [Effort, ...Effort[]], effort: Effort): Effort {
  if (efforts.includes(effort)) return effort
  const levels = efforts.filter((each) => each !== 'off')
  const rank = Effort.options.indexOf(effort)
  return (
    levels.findLast((level) => Effort.options.indexOf(level) <= rank) ?? levels[0] ?? efforts[0]
  )
}

/** The failures a turn ends with, rows of the failure table that the screen reads by code. */
export const TurnFailureCode = z.enum([
  'MODEL_NO_ACCOUNT',
  'MODEL_CALL_FAILED',
  'SAVE_REFUSED',
  'GIT_RESTORE_NEEDED',
  'MACHINE_LOST',
  'MACHINE_UNAVAILABLE',
  'QUESTION_EXPIRED',
  'INTERNAL_UNEXPECTED',
] as const satisfies readonly FailureCode[])
export type TurnFailureCode = z.infer<typeof TurnFailureCode>

export const MessageId = z.string().min(1).brand('MessageId')
export type MessageId = z.infer<typeof MessageId>

/** What a tool call was about: a page, a search, a file, a command, what a check found, or nothing to say. */
const ToolSubject = z.union([
  z.object({ url: z.url(), title: Subject.nullable() }),
  z.object({ query: Subject }),
  z.object({ path: Subject }),
  z.object({ command: Subject }),
  z.object({ check: Subject }),
  z.null(),
])

/**
 * A piece of a message. `reasoning` and `tool` carry an `id`: a later part with the same `id`
 * replaces it. Their states follow the controller's `ActiveToolState.status`; the thinking's text,
 * the provider's words and a tool's arguments and result never leave the server, but for a tool's
 * `detail`, cut (security S9, design V39, code C51).
 */
export const MessagePart = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({
    type: z.literal('reasoning'),
    id: z.string().min(1),
    state: z.enum(['running', 'completed']),
    /** How long it thought, by the server's clock; `null` while it thinks or when none was kept. */
    seconds: z.int().nonnegative().nullable(),
  }),
  z.object({
    type: z.literal('tool'),
    id: z.string().min(1),
    kind: z.enum([
      'read_page',
      'search_web',
      'recall',
      'write_file',
      'edit_file',
      'read_file',
      'run_command',
      'check',
      'other',
    ]),
    state: z.enum(['running', 'completed', 'error', 'denied']),
    subject: ToolSubject,
    /** What the row opens on; none for a tool that only has its subject to say. */
    detail: ToolDetail.optional(),
  }),
  z.object({
    type: z.literal('file'),
    toolId: z.string().min(1),
    path: Subject,
    operation: z.enum(['write', 'edit']),
  }),
  /**
   * What the machine is doing before a tool can run; the latest replaces the one before, except the
   * phases that last (`machinePhaseLasts`).
   */
  z.object({
    type: z.literal('machine'),
    phase: z.enum(['starting', 'waking', 'copying', 'replaced', 'saving']),
  }),
  /**
   * The server restarted in the middle of the turn, which ended there. `kept` is the version that
   * saved what the Builder had written, `nothing` when it had written nothing, or `lost` when the
   * restart cut its save and its files were not saved.
   */
  z.object({
    type: z.literal('restarted'),
    kept: z.union([z.int().positive(), z.enum(['nothing', 'lost'])]),
  }),
  /**
   * The version the turn saved: its number, whether it changed the app, how many files it holds
   * and how many of them changed, and what the end of the turn's check said; none when the turn
   * ended before its check ran (stopped, the hour, an error).
   */
  z.object({
    type: z.literal('version'),
    number: z.int().positive(),
    changed: z.boolean(),
    files: z.int().nonnegative(),
    changedFiles: z.int().nonnegative(),
    check: VersionCheck.optional(),
  }),
  z.object({ type: z.literal('notice'), text: z.string() }),
  z.object({ type: z.literal('failure'), code: TurnFailureCode }),
  QuestionPart,
  PlanPart,
  TasksPart,
])
export type MessagePart = z.infer<typeof MessagePart>

export const Message = z.object({
  id: MessageId,
  role: z.enum(['person', 'builder']),
  parts: z.array(MessagePart),
  /** The model that answered the Builder's turn, as Mastra recorded it; `null` for the person. */
  model: ModelId.nullable(),
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
  model: ModelId,
  effort: Effort,
  messages: z.array(Message),
})
export type Conversation = z.infer<typeof Conversation>

/**
 * What the stream of a conversation says. `turn` opens each turn, and on a reconnect that cannot
 * resume it is the turn in progress so far; `part` adds a part, or replaces the one with its `id`;
 * a failed turn's `failure` part comes before its `turnEnd`.
 */
export const ConversationEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('turn'), message: Message, startedAt: z.iso.datetime() }),
  z.object({ type: z.literal('text'), delta: z.string() }),
  z.object({ type: z.literal('part'), part: MessagePart }),
  z.object({ type: z.literal('notice'), text: z.string() }),
  z.object({ type: z.literal('title'), title: z.string() }),
  z.object({ type: z.literal('turnEnd'), reason: z.enum(['complete', 'aborted', 'error']) }),
])
export type ConversationEvent = z.infer<typeof ConversationEvent>

/**
 * Whether a machine phase is a fact that stays said on the thread, without a clock: a replaced
 * machine. Every other phase is a step in progress, over once anything follows it.
 */
export function machinePhaseLasts(
  phase: Extract<MessagePart, { type: 'machine' }>['phase'],
): boolean {
  return phase === 'replaced'
}

/** The events that change a message's parts. */
export type PartEvent = Extract<ConversationEvent, { type: 'text' | 'part' | 'notice' }>

/** What names a part among the message's, so a later one replaces it; none for the rest. */
function partKey(part: MessagePart): string | undefined {
  switch (part.type) {
    case 'reasoning':
    case 'tool':
      return `${part.type}:${part.id}`
    case 'question':
    case 'plan':
      return `${part.type}:${part.toolCallId}`
    case 'tasks':
      return 'tasks'
    case 'file':
      return `${part.type}:${part.toolId}`
    case 'machine':
      return machinePhaseLasts(part.phase) ? undefined : 'machine'
    default:
      return undefined
  }
}

/**
 * A message's parts after one event, the only fold of events into parts, on the server and the
 * screen alike: text after text is one text, since Claude cuts an answer into one block per span it
 * cites; a tool, thinking, file or machine part replaces the one it names; any other comes at the end.
 */
export function applyEvent(parts: readonly MessagePart[], event: PartEvent): MessagePart[] {
  switch (event.type) {
    case 'text': {
      const last = parts.at(-1)
      return last?.type === 'text'
        ? [...parts.slice(0, -1), { type: 'text', text: last.text + event.delta }]
        : [...parts, { type: 'text', text: event.delta }]
    }
    case 'part': {
      const { part } = event
      const key = partKey(part)
      const at = key === undefined ? -1 : parts.findIndex((each) => partKey(each) === key)
      return at === -1 ? [...parts, part] : parts.with(at, part)
    }
    case 'notice':
      return [...parts, { type: 'notice', text: event.text }]
    default:
      return event satisfies never
  }
}

/** How often the stream says it is alive, so a proxy keeps it open. */
export const CONVERSATION_HEARTBEAT_MS = 25_000

const InProject = z.object({ companyId: CompanyId, projectId: ProjectId })
export const OfConversation = InProject.extend({ conversationId: ConversationId })
export const BASE = '/api/companies/{companyId}/projects/{projectId}/conversations'
export const READ_FAILURES = [
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
  input: { params: InProject, body: z.object({ model: ModelId.optional() }) },
  attemptKey: true,
  success: {
    status: 201,
    body: z.object({ conversation: ConversationSummary.extend({ model: ModelId }) }),
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
  failures: [...READ_FAILURES, 'IDEMPOTENCY_CONFLICT', 'RUN_BUSY'],
})

export const streamConversation = defineOperation({
  id: 'streamConversation',
  summary: `Streams a conversation: the events after ${LAST_EVENT_ID_HEADER}, or the turn in progress first, then each new event.`,
  access: 'session',
  method: 'GET',
  path: `${BASE}/{conversationId}/events`,
  bodyLimit: 1024,
  input: { params: OfConversation },
  success: {
    status: 200,
    events: ConversationEvent,
    heartbeatMs: CONVERSATION_HEARTBEAT_MS,
    resumable: true,
  },
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
  summary: 'Changes the model of a conversation and its reasoning effort, for its next answers.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{conversationId}/model`,
  bodyLimit: 1024,
  input: { params: OfConversation, body: z.object({ model: ModelId, effort: Effort }) },
  success: { status: 200, body: z.object({ model: ModelId, effort: Effort }) },
  failures: [...READ_FAILURES, 'MODEL_UNKNOWN', 'MODEL_NO_ACCOUNT', 'EFFORT_UNSUPPORTED'],
})
