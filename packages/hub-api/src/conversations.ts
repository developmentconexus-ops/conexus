import { z } from 'zod'
import { CompanyId, Next, Page } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { MastraPart, MessageUpdate, Suspended } from './mastra-parts.ts'
import { ATTEMPT_KEY_HEADER, defineOperation, LAST_EVENT_ID_HEADER } from './operation.ts'
import { ProjectId } from './projects.ts'
import { Task } from './questions.ts'

export const ConversationId = z.uuid().brand('ConversationId')
export type ConversationId = z.infer<typeof ConversationId>

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
  'MODEL_REFUSED',
  'MODEL_ANSWER_CUT',
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

/** The part of a message that says a thinking took `seconds`, by our clock (step 12.1). */
export const THOUGHT_PART = 'data-conexus-thought'

/**
 * A message as Mastra keeps it: its parts by Mastra's names, `cuts` where the Hub kept less; and
 * `suspended`, the calls the message left waiting for the person, with what each suspended with.
 */
export const Message = z.object({
  id: MessageId,
  role: z.enum(['person', 'builder']),
  parts: z.array(MastraPart),
  suspended: z.record(z.string(), Suspended),
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

/** The observational memory's progress, as the controller holds it (`OMProgressState`). */
export const OMProgress = z.object({
  status: z.enum(['idle', 'observing', 'reflecting']),
  pendingTokens: z.number(),
  threshold: z.number(),
  thresholdPercent: z.number(),
  observationTokens: z.number(),
  reflectionThreshold: z.number(),
  reflectionThresholdPercent: z.number(),
  generationCount: z.number(),
  stepNumber: z.number(),
})
export type OMProgress = z.infer<typeof OMProgress>

export const Conversation = ConversationSummary.extend({
  model: ModelId,
  effort: Effort,
  messages: z.array(Message),
  /** The Builder's task list, as Mastra's storage holds it. */
  tasks: z.array(Task),
  /** The memory's progress in this session, or `null` before it says. */
  memory: OMProgress.nullable(),
  /**
   * Whether a turn is in progress: its answer then comes on the stream, and a screen that
   * reconnected waits for it only while this holds.
   */
  inProgress: z.boolean(),
})
export type Conversation = z.infer<typeof Conversation>

const OmWindow = z.object({ tokens: z.number(), threshold: z.number() })
const OmBuffer = z.object({ status: z.enum(['idle', 'running', 'complete']) })
const OmCycle = z.object({ cycleId: z.string() })
const OmOperation = OmCycle.extend({ operationType: z.enum(['observation', 'reflection']) })
const OmFailed = OmCycle.extend({ durationMs: z.number() })

/**
 * What the stream of a conversation says: `turn` opens each turn, and on a reconnect that cannot
 * resume it is the turn in progress so far, as Mastra's messages by their ids and then ours; `turnEnd` closes it. The rest are the controller's own
 * events (`AgentControllerWireEvent`), cut by `wire.ts` and without the free text of an error or of
 * the observer (security S41). A part of ours goes as a `message_update` of a `data-conexus-*` part.
 */
export const ConversationEvent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('turn'), messages: z.array(Message), startedAt: z.iso.datetime() }),
  z.object({ type: z.literal('turnEnd'), reason: z.enum(['complete', 'aborted', 'error']) }),
  z.object({ type: z.literal('message_start'), message: Message }),
  z.object({ type: z.literal('message_update'), id: MessageId, event: MessageUpdate }),
  z.object({ type: z.literal('message_end'), id: MessageId }),
  z.object({
    type: z.literal('shell_output'),
    toolCallId: z.string().min(1),
    output: z.string(),
    stream: z.enum(['stdout', 'stderr']),
    cuts: z.array(z.string()).optional(),
  }),
  z.object({
    type: z.literal('command_exit'),
    toolCallId: z.string().min(1),
    exitCode: z.int(),
    success: z.boolean(),
  }),
  z.object({
    type: z.literal('tool_suspended'),
    toolCallId: z.string().min(1),
    toolName: z.string(),
    args: z.unknown(),
    suspendPayload: z.unknown(),
    cuts: z.array(z.string()).optional(),
  }),
  z.object({ type: z.literal('task_updated'), tasks: z.array(Task) }),
  z.object({
    type: z.literal('om_status'),
    windows: z.object({
      active: z.object({ messages: OmWindow, observations: OmWindow }),
      buffered: z.object({ observations: OmBuffer, reflection: OmBuffer }),
    }),
    stepNumber: z.number(),
    generationCount: z.number(),
  }),
  z.object({ type: z.literal('om_observation_start'), ...OmOperation.shape }),
  z.object({ type: z.literal('om_observation_end'), ...OmCycle.shape, durationMs: z.number() }),
  z.object({ type: z.literal('om_observation_failed'), ...OmFailed.shape }),
  z.object({ type: z.literal('om_reflection_start'), ...OmCycle.shape }),
  z.object({ type: z.literal('om_reflection_end'), ...OmCycle.shape, durationMs: z.number() }),
  z.object({ type: z.literal('om_reflection_failed'), ...OmFailed.shape }),
  z.object({ type: z.literal('om_buffering_start'), ...OmOperation.shape }),
  z.object({ type: z.literal('om_buffering_end'), ...OmOperation.shape }),
  z.object({ type: z.literal('om_buffering_failed'), ...OmOperation.shape }),
  // The memory's progress once Mastra folded an `om_*` event (`displayState`), as Factory reads it.
  z.object({
    type: z.literal('om_progress'),
    omProgress: OMProgress,
    bufferingMessages: z.boolean(),
    bufferingObservations: z.boolean(),
  }),
  z.object({
    type: z.literal('agent_end'),
    reason: z.enum(['complete', 'aborted', 'error', 'suspended']).optional(),
  }),
])
export type ConversationEvent = z.infer<typeof ConversationEvent>

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
