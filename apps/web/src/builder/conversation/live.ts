import type {
  ConversationEvent,
  Message,
  MessageId,
  OMProgress,
  Suspended,
  Task,
} from '@conexus/hub-api'
import { applyUpdate } from '@conexus/hub-api'
import type { Steer } from './steers.ts'
import { steered } from './steers.ts'
import type { Running, TranscriptItem } from './transcript.ts'
import { fromMessages, heardOf } from './transcript.ts'

type OMPhase = 'idle' | 'buffering' | 'observing' | 'reflecting'
type MemoryFailure = 'observation' | 'reflection' | 'buffering'

/**
 * The turn in progress as the screen holds it: the messages as the stream gave them, by id: Mastra's
 * steps, and the one of ours, named by the turn, which the stream tells its parts into. The rows
 * are derived from these (`itemsOf`), never kept beside them.
 */
type Turn = {
  /** What the person sent into the turn that no `message_start` has confirmed Mastra read. */
  steers: readonly Steer[]
  startedAt: string | null
  /** The id of the message of ours: the turn's, which the stream opens last. */
  answerId: MessageId | null
  messages: readonly Message[]
  suspended: Readonly<Record<string, Suspended>>
  running: Readonly<Record<string, Running>>
  /** When the screen first heard of each tool call, by its id, epoch ms (Factory `tool_start`). */
  heard: Readonly<Record<string, number>>
  tasks: readonly Task[] | null
  memory: OMProgress | null
  omPhase: OMPhase
  memoryFailed: MemoryFailure | null
}

/** `returned`: the steers no `message_start` confirmed before the turn ended, to go back in the field. */
export type Live =
  | { kind: 'idle' }
  | { kind: 'answering' | 'resuming'; turn: Turn }
  | { kind: 'ended'; turn: Turn; returned: readonly string[] }

export const IDLE: Live = { kind: 'idle' }

export type Step =
  | ConversationEvent
  | { type: 'sent' }
  | { type: 'unsent' }
  | { type: 'reconnected'; inProgress: boolean }
  | { type: 'steer'; steer: Steer }
  | { type: 'unsteered'; id: MessageId }
  | { type: 'returnedShown' }

const NO_TURN: Turn = {
  steers: [],
  startedAt: null,
  answerId: null,
  messages: [],
  suspended: {},
  running: {},
  heard: {},
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
function opened(
  step: Extract<ConversationEvent, { type: 'turn' }>,
  steers: readonly Steer[],
): Turn {
  const held = new Set(step.messages.map((message) => message.id))
  return {
    ...NO_TURN,
    steers: steers.filter((steer) => !held.has(steer.id)),
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
    case 'message_start': {
      const { message } = step
      const steers =
        message.role === 'person'
          ? turn.steers.filter((steer) => steer.id !== message.id)
          : turn.steers
      return {
        ...turn,
        steers,
        messages: started(turn.messages, message),
        heard: heardOf(turn.heard, message.parts),
      }
    }
    case 'message_update': {
      const next = updated(turn, step)
      const parts = next.messages.find((message) => message.id === step.id)?.parts ?? []
      return { ...next, heard: heardOf(turn.heard, parts) }
    }
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

type Told = Exclude<ConversationEvent, { type: 'turn' | 'turnEnd' }>

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

function ended(turn: Turn): Live {
  return {
    kind: 'ended',
    turn: { ...turn, steers: [] },
    returned: turn.steers.map((each) => each.content),
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
      return step.inProgress ? { kind: 'resuming', turn: state.turn } : ended(state.turn)
    case 'turn': {
      const running = state.kind === 'answering' || state.kind === 'resuming'
      return { kind: 'answering', turn: opened(step, running ? state.turn.steers : []) }
    }
    case 'turnEnd':
      return state.kind === 'answering' || state.kind === 'resuming' ? ended(state.turn) : state
    case 'steer':
    case 'unsteered':
      if (state.kind !== 'answering' && state.kind !== 'resuming') return state
      return { ...state, turn: { ...state.turn, steers: steered(state.turn.steers, step) } }
    case 'returnedShown':
      return state.kind === 'ended' ? { ...state, returned: [] } : state
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
    heard: turn.heard,
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
