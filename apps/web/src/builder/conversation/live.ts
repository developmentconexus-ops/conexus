import type {
  ConversationEvent,
  Message,
  MessageId,
  OMProgress,
  Suspended,
  Task,
} from '@conexus/hub-api'
import { applyUpdate } from '@conexus/hub-api'
import type { Running, TranscriptItem } from './transcript.ts'
import { fromMessages } from './transcript.ts'

type OMPhase = 'idle' | 'buffering' | 'observing' | 'reflecting'
type MemoryFailure = 'observation' | 'reflection' | 'buffering'

/**
 * The turn in progress as the screen holds it: the messages as the stream gave them, by id: Mastra's
 * steps, and the one of ours, named by the turn, which the stream tells its parts into. The rows
 * are derived from these (`itemsOf`), never kept beside them.
 */
type Turn = {
  startedAt: string | null
  /** The id of the message of ours: the turn's, which the stream opens last. */
  answerId: MessageId | null
  messages: readonly Message[]
  suspended: Readonly<Record<string, Suspended>>
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
  | { type: 'reconnected'; inProgress: boolean }

const NO_TURN: Turn = {
  startedAt: null,
  answerId: null,
  messages: [],
  suspended: {},
  running: {},
  tasks: null,
  memory: null,
  omPhase: 'idle',
  memoryFailed: null,
}

/** The memory's progress as Mastra's display state holds it; its buffering shows as the phase. */
function handleOmProgress(
  turn: Turn,
  step: Extract<ConversationEvent, { type: 'om_progress' }>,
): Turn {
  const buffering = step.bufferingMessages || step.bufferingObservations
  const omPhase =
    turn.omPhase === 'idle' && buffering
      ? 'buffering'
      : turn.omPhase === 'buffering' && !buffering
        ? 'idle'
        : turn.omPhase
  return { ...turn, memory: step.omProgress, omPhase }
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

/** The turn the stream opens with: the turn so far as its messages, the one of ours the last. */
function opened(step: Extract<ConversationEvent, { type: 'turn' }>): Turn {
  return {
    ...NO_TURN,
    startedAt: step.startedAt,
    answerId: step.messages.at(-1)?.id ?? null,
    messages: step.messages,
  }
}

/** A message the stream tells again, as Mastra's `message_start` does, takes the place of its first telling. */
function started(messages: readonly Message[], message: Message): readonly Message[] {
  const at = messages.findIndex((each) => each.id === message.id)
  return at === -1 ? [...messages, message] : messages.with(at, message)
}

/**
 * An update of a message, by its id, as Mastra's display state applies it; one of an id the turn
 * does not hold is not told (a step whose start the screen missed).
 */
function updated(turn: Turn, step: Extract<ConversationEvent, { type: 'message_update' }>): Turn {
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
      const { toolCallId, toolName, args, suspendPayload, cuts } = step
      const suspended = {
        ...turn.suspended,
        [toolCallId]: { toolCallId, toolName, args, suspendPayload, cuts },
      }
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
      return turn
    case 'om_progress':
      return handleOmProgress(turn, step)
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
      return state.kind === 'answering' && state.turn.messages.length === 0 ? IDLE : state
    case 'reconnected':
      // A turn that ended while the line was down sends no `turnEnd` to this line: the read says it is over.
      if (state.kind !== 'answering') return state
      return { kind: step.inProgress ? 'resuming' : 'ended', turn: state.turn }
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

/** The rows of the turn's answer, derived from what the stream told, our parts after Mastra's. */
export function itemsOf(state: Live): readonly TranscriptItem[] {
  if (state.kind === 'idle') return []
  const { turn } = state
  const ours = turn.messages.filter((message) => message.id === turn.answerId)
  const steps = turn.messages.filter((message) => message.id !== turn.answerId)
  return fromMessages([...steps, ...ours], {
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
  return turn.messages.some((message) => message.parts.length > 0)
}
