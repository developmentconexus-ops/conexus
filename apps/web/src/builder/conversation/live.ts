import type {
  ConversationEvent,
  MastraPart,
  Message,
  MessageId,
  OMProgress,
  Suspension,
  Task,
} from '@conexus/hub-api'
import { applyUpdate } from '@conexus/hub-api'
import type { Running, TranscriptItem } from './transcript.ts'
import { fromMessages, isOurs } from './transcript.ts'

type OMPhase = 'idle' | 'buffering' | 'observing' | 'reflecting'
type MemoryFailure = 'observation' | 'reflection' | 'buffering'

/**
 * The turn in progress as the screen holds it: Mastra's messages as the stream gave them, by id,
 * and the parts of ours, which the stream tells as updates of the turn's own id. The rows are
 * derived from these (`itemsOf`), never kept beside them.
 */
export type Turn = {
  startedAt: string | null
  /** The id of the message the stream tells our parts under: the turn's. */
  answerId: MessageId | null
  messages: readonly Message[]
  ours: readonly MastraPart[]
  suspended: Readonly<Record<string, Suspension>>
  running: Readonly<Record<string, Running>>
  tasks: readonly Task[] | null
  memory: OMProgress | null
  omPhase: OMPhase
  memoryFailed: MemoryFailure | null
}

export type Live = { kind: 'idle' } | { kind: 'answering' | 'resuming' | 'ended'; turn: Turn }

export const IDLE: Live = { kind: 'idle' }

export type Step =
  | ConversationEvent
  | { type: 'sent' }
  | { type: 'unsent' }
  | { type: 'reconnected' }

const NO_TURN: Turn = {
  startedAt: null,
  answerId: null,
  messages: [],
  ours: [],
  suspended: {},
  running: {},
  tasks: null,
  memory: null,
  omPhase: 'idle',
  memoryFailed: null,
}

function handleOmStatus(turn: Turn, step: Extract<ConversationEvent, { type: 'om_status' }>): Turn {
  const msgWindow = step.windows.active.messages
  const obsWindow = step.windows.active.observations
  const status =
    turn.omPhase === 'observing' || turn.omPhase === 'reflecting' ? turn.omPhase : 'idle'
  const memory: OMProgress = {
    status,
    pendingTokens: msgWindow.tokens,
    threshold: msgWindow.threshold,
    thresholdPercent: msgWindow.threshold > 0 ? (msgWindow.tokens / msgWindow.threshold) * 100 : 0,
    observationTokens: obsWindow.tokens,
    reflectionThreshold: obsWindow.threshold,
    reflectionThresholdPercent:
      obsWindow.threshold > 0 ? (obsWindow.tokens / obsWindow.threshold) * 100 : 0,
    generationCount: step.generationCount,
    stepNumber: step.stepNumber,
  }
  return { ...turn, memory }
}

function handleOmPhaseEvent(
  turn: Turn,
  step: Extract<
    ConversationEvent,
    | { type: 'om_observation_start' }
    | { type: 'om_observation_end' }
    | { type: 'om_observation_failed' }
    | { type: 'om_reflection_start' }
    | { type: 'om_reflection_end' }
    | { type: 'om_reflection_failed' }
    | { type: 'om_buffering_start' }
    | { type: 'om_buffering_end' }
    | { type: 'om_buffering_failed' }
  >,
): Turn {
  switch (step.type) {
    case 'om_observation_start':
      return { ...turn, omPhase: 'observing' }
    case 'om_observation_end':
      return { ...turn, omPhase: 'idle', memoryFailed: null }
    case 'om_observation_failed':
      return { ...turn, omPhase: 'idle', memoryFailed: 'observation' }
    case 'om_reflection_start':
      return { ...turn, omPhase: 'reflecting' }
    case 'om_reflection_end':
      return { ...turn, omPhase: 'idle', memoryFailed: null }
    case 'om_reflection_failed':
      return { ...turn, omPhase: 'idle', memoryFailed: 'reflection' }
    case 'om_buffering_start':
      return { ...turn, omPhase: 'buffering' }
    case 'om_buffering_end':
      return { ...turn, omPhase: 'idle', memoryFailed: null }
    case 'om_buffering_failed':
      return { ...turn, omPhase: 'idle', memoryFailed: 'buffering' }
    default:
      return step satisfies never
  }
}

/**
 * The turn the stream opens with: a reconnect that cannot resume tells the turn so far as one
 * message, and what it waits on. Our parts leave it, to be told again as updates of its id.
 */
function opened(step: Extract<ConversationEvent, { type: 'turn' }>): Turn {
  const { message } = step
  const parts = message.parts.filter((part) => !isOurs(part))
  return {
    ...NO_TURN,
    startedAt: step.startedAt,
    answerId: message.id,
    messages: parts.length === 0 ? [] : [{ ...message, parts }],
    ours: message.parts.filter(isOurs),
    suspended: message.suspended,
  }
}

/** A message the stream tells again, as Mastra's `message_start` does, takes the place of its first telling. */
function started(messages: readonly Message[], message: Message): readonly Message[] {
  const at = messages.findIndex((each) => each.id === message.id)
  return at === -1 ? [...messages, message] : messages.with(at, message)
}

/**
 * An update of a message, by its id, as Mastra's display state applies it; one of an id the turn
 * does not hold is not told (a step the screen opened after, whose start it missed). Our parts
 * come as updates of the turn's id.
 */
function updated(turn: Turn, step: Extract<ConversationEvent, { type: 'message_update' }>): Turn {
  if (step.id === turn.answerId) {
    return { ...turn, ours: applyUpdate(turn.ours, step.event) }
  }
  const at = turn.messages.findIndex((message) => message.id === step.id)
  const message = turn.messages[at]
  if (message === undefined) return turn
  const parts = applyUpdate(message.parts, step.event)
  return { ...turn, messages: turn.messages.with(at, { ...message, parts }) }
}

function handleMessageEvent(
  turn: Turn,
  step: Extract<
    ConversationEvent,
    | { type: 'message_start' }
    | { type: 'message_update' }
    | { type: 'message_end' }
    | { type: 'shell_output' }
    | { type: 'command_exit' }
    | { type: 'tool_suspended' }
    | { type: 'agent_end' }
  >,
): Turn {
  switch (step.type) {
    case 'message_start':
      return { ...turn, messages: started(turn.messages, step.message) }
    case 'message_update':
      return updated(turn, step)
    case 'message_end':
      return turn
    case 'shell_output': {
      const { output, cuts } = step
      const running = { ...turn.running[step.toolCallId], output, cuts }
      return { ...turn, running: { ...turn.running, [step.toolCallId]: running } }
    }
    case 'command_exit': {
      const was = turn.running[step.toolCallId] ?? { output: '' }
      const running = { ...was, exit: { code: step.exitCode, success: step.success } }
      return { ...turn, running: { ...turn.running, [step.toolCallId]: running } }
    }
    case 'tool_suspended': {
      const { suspendPayload, cuts } = step
      const suspended = { ...turn.suspended, [step.toolCallId]: { suspendPayload, cuts } }
      return { ...turn, suspended }
    }
    case 'agent_end':
      return { ...turn, omPhase: 'idle' }
    default:
      return step satisfies never
  }
}

type Told = Exclude<Step, { type: 'sent' | 'unsent' | 'reconnected' | 'turn' | 'turnEnd' }>

/** What the stream tells goes to the turn in progress; one told after the end begins another. */
function inTurn(state: Live, step: Told): Live {
  const turn = state.kind === 'answering' || state.kind === 'resuming' ? state.turn : NO_TURN
  return { kind: 'answering', turn: nextTurn(turn, step) }
}

function nextTurn(turn: Turn, step: Told): Turn {
  switch (step.type) {
    case 'task_updated':
      return { ...turn, tasks: step.tasks }
    case 'om_status':
      return handleOmStatus(turn, step)
    case 'om_observation_start':
    case 'om_observation_end':
    case 'om_observation_failed':
    case 'om_reflection_start':
    case 'om_reflection_end':
    case 'om_reflection_failed':
    case 'om_buffering_start':
    case 'om_buffering_end':
    case 'om_buffering_failed':
      return handleOmPhaseEvent(turn, step)
    case 'message_start':
    case 'message_update':
    case 'message_end':
    case 'shell_output':
    case 'command_exit':
    case 'tool_suspended':
    case 'agent_end':
      return handleMessageEvent(turn, step)
    default:
      return step satisfies never
  }
}

export function live(state: Live, step: Step): Live {
  switch (step.type) {
    case 'sent':
      return state.kind === 'answering'
        ? state
        : { kind: 'answering', turn: state.kind === 'resuming' ? state.turn : NO_TURN }
    case 'unsent':
      return state.kind === 'answering' &&
        state.turn.messages.length === 0 &&
        state.turn.ours.length === 0
        ? IDLE
        : state
    case 'reconnected':
      return state.kind === 'answering' ? { kind: 'resuming', turn: state.turn } : state
    case 'turn':
      return { kind: 'answering', turn: opened(step) }
    case 'turnEnd':
      return state.kind === 'answering' || state.kind === 'resuming'
        ? { kind: 'ended', turn: state.turn }
        : state
    default:
      return inTurn(state, step)
  }
}

/** The rows of the turn's answer, derived from what the stream told. */
export function itemsOf(state: Live): readonly TranscriptItem[] {
  if (state.kind === 'idle') return []
  const { turn } = state
  const ours: Message[] =
    turn.answerId === null || turn.ours.length === 0
      ? []
      : [
          {
            id: turn.answerId,
            role: 'builder',
            parts: [...turn.ours],
            suspended: {},
            model: null,
            createdAt: turn.startedAt ?? '',
          },
        ]
  return fromMessages([...turn.messages, ...ours], {
    suspended: turn.suspended,
    running: turn.running,
    live: state.kind === 'answering' || state.kind === 'resuming',
  })
}

/** Whether the turn waits on the person: a question or a plan is open. */
export function waitsOnPerson(items: readonly TranscriptItem[]): boolean {
  return items.some((item) => item.kind === 'card' && item.state === 'open')
}

export function shownAnswer(
  state: Live,
  messages: readonly Message[],
): { items: readonly TranscriptItem[]; streaming: boolean } | null {
  switch (state.kind) {
    case 'idle':
      return null
    case 'answering':
      return { items: itemsOf(state), streaming: true }
    case 'resuming':
    case 'ended':
      return messages.at(-1)?.role === 'builder' || !heardAnything(state.turn)
        ? null
        : { items: itemsOf(state), streaming: false }
    default:
      return state satisfies never
  }
}

function heardAnything(turn: Turn): boolean {
  return turn.messages.length > 0 || turn.ours.length > 0
}
