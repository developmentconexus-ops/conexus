import type {
  ConversationEvent,
  Message,
  MessageId,
  OMProgress,
  Suspended,
  Task,
} from '@conexus/hub-api'
import { applyUpdate } from '@conexus/hub-api'
import type { Running } from './parts.ts'
import { heardOf } from './parts.ts'

type OMPhase = 'idle' | 'buffering' | 'observing' | 'reflecting'
type MemoryFailure = 'observation' | 'reflection' | 'buffering'

/**
 * A line of the conversation: a message by its id, Mastra's or ours under the run's id; or the
 * question the screen sent, by the id the server saves it under (`questionIdOf`), until a read
 * holds it. It opens its turn, so the turn keeps one key before the read and after. A `local`
 * entry is a message sent into the running turn (Factory `localUser`): it has the same id, so the
 * person's `message_start`, or a read, takes its place by id, and it is pending until then. A send
 * that fails marks it `failed` (Factory `failLocalUser`), and the text stays in the field.
 */
export type Entry =
  | { kind: 'message'; message: Message }
  | { kind: 'asked'; id: MessageId }
  | { kind: 'local'; id: MessageId; text: string; delivery: 'pending' | 'failed' }

/**
 * The conversation as the stream told it, one entry per id (Factory `upsertMessage`), and what
 * Mastra's messages do not carry. A read joins it by id in `merge`.
 */
export type Timeline = {
  entries: readonly Entry[]
  /** Ours: the stream opens it last, and Mastra's steps go before it, as the server's `turn` says. */
  ours: MessageId | null
  suspended: Readonly<Record<string, Suspended>>
  running: Readonly<Record<string, Running>>
  /** When the screen first heard of each tool call, by its id, epoch ms (Factory `tool_start`). */
  heard: Readonly<Record<string, number>>
}

type Turn = {
  timeline: Timeline
  startedAt: string | null
  tasks: readonly Task[] | null
  memory: OMProgress | null
  omPhase: OMPhase
  memoryFailed: MemoryFailure | null
}

/** `returned`: the texts no `message_start` confirmed before the turn ended, to go back in the field. */
export type Live =
  | { kind: 'idle' }
  | { kind: 'answering' | 'resuming'; turn: Turn }
  | { kind: 'ended'; turn: Turn; returned: readonly string[] }

export const IDLE: Live = { kind: 'idle' }

export type Step =
  | ConversationEvent
  | { type: 'sent'; asked: MessageId }
  | { type: 'unsent' }
  | { type: 'reconnected'; inProgress: boolean }
  | { type: 'steer'; id: MessageId; text: string }
  | { type: 'steerFailed'; id: MessageId }
  | { type: 'returnedShown' }

const NO_TIMELINE: Timeline = { entries: [], ours: null, suspended: {}, running: {}, heard: {} }

const NO_TURN: Turn = {
  timeline: NO_TIMELINE,
  startedAt: null,
  tasks: null,
  memory: null,
  omPhase: 'idle',
  memoryFailed: null,
}

function idOf(entry: Entry): MessageId {
  return entry.kind === 'message' ? entry.message.id : entry.id
}

function entryOf(message: Message): Entry {
  return { kind: 'message', message }
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

type OmPhaseEvent = Extract<
  ConversationEvent,
  { type: `om_${'observation' | 'reflection' | 'buffering'}_${'start' | 'end' | 'failed'}` }
>

function handleOmPhaseEvent(turn: Turn, step: OmPhaseEvent): Turn {
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

/** The turn the stream opens with: the turn so far as its messages, ours the last. */
function opened(step: Extract<ConversationEvent, { type: 'turn' }>, was: Turn): Turn {
  const held = new Set(step.messages.map((message) => message.id))
  const kept = was.timeline.entries.filter(
    (entry) => entry.kind === 'asked' || (entry.kind === 'local' && !held.has(entry.id)),
  )
  const entries = [...kept, ...step.messages.map(entryOf)]
  return {
    ...NO_TURN,
    startedAt: step.startedAt,
    timeline: { ...NO_TIMELINE, entries, ours: step.messages.at(-1)?.id ?? null },
  }
}

/** A message told again, as Mastra's `message_start` does, takes the place of its first telling. */
function started(timeline: Timeline, message: Message): readonly Entry[] {
  const entries = timeline.entries.filter(
    (entry) => entry.kind !== 'local' || entry.id !== message.id,
  )
  const at = entries.findIndex((entry) => idOf(entry) === message.id)
  if (at !== -1) return entries.with(at, entryOf(message))
  const ours = entries.findIndex((entry) => idOf(entry) === timeline.ours)
  return ours === -1 ? [...entries, entryOf(message)] : entries.toSpliced(ours, 0, entryOf(message))
}

/** An update of a message by its id; one the timeline does not hold is not told (a missed start). */
function updated(timeline: Timeline, id: MessageId, update: Parameters<typeof applyUpdate>[1]) {
  const at = timeline.entries.findIndex((entry) => idOf(entry) === id)
  const entry = timeline.entries[at]
  if (entry?.kind !== 'message') return timeline
  const parts = applyUpdate(entry.message.parts, update)
  const message = { ...entry.message, parts }
  return {
    ...timeline,
    entries: timeline.entries.with(at, entryOf(message)),
    heard: heardOf(timeline.heard, parts),
  }
}

type Told = Extract<
  ConversationEvent,
  | { type: 'message_start' }
  | { type: 'message_update' }
  | { type: 'message_end' }
  | { type: 'shell_output' }
  | { type: 'command_exit' }
  | { type: 'tool_suspended' }
>

/** What the stream tells of the conversation's messages, upserted by id. */
function event(timeline: Timeline, step: Told): Timeline {
  switch (step.type) {
    case 'message_start': {
      const { message } = step
      const heard = heardOf(timeline.heard, message.parts)
      return { ...timeline, entries: started(timeline, message), heard }
    }
    case 'message_update':
      return updated(timeline, step.id, step.event)
    case 'message_end':
      return timeline
    case 'shell_output': {
      const { output, cuts } = step
      const running = { ...timeline.running[step.toolCallId], output, cuts }
      return { ...timeline, running: { ...timeline.running, [step.toolCallId]: running } }
    }
    case 'command_exit': {
      const was = timeline.running[step.toolCallId] ?? { output: '' }
      const running = { ...was, exit: { code: step.exitCode, success: step.success } }
      return { ...timeline, running: { ...timeline.running, [step.toolCallId]: running } }
    }
    case 'tool_suspended': {
      const { toolCallId, toolName, args, suspendPayload, cuts } = step
      const suspended = {
        ...timeline.suspended,
        [toolCallId]: { toolCallId, toolName, args, suspendPayload, cuts },
      }
      return { ...timeline, suspended }
    }
    default:
      return step satisfies never
  }
}

function nextTurn(
  turn: Turn,
  step: Exclude<ConversationEvent, { type: 'turn' | 'turnEnd' }>,
): Turn {
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
    case 'agent_end':
      return { ...turn, omPhase: 'idle' }
    default:
      return { ...turn, timeline: event(turn.timeline, step) }
  }
}

function ended(turn: Turn): Live {
  const { entries } = turn.timeline
  return {
    kind: 'ended',
    turn: {
      ...turn,
      timeline: { ...turn.timeline, entries: entries.filter((entry) => entry.kind !== 'local') },
    },
    returned: entries.flatMap((entry) =>
      entry.kind === 'local' && entry.delivery === 'pending' ? [entry.text] : [],
    ),
  }
}

function running(state: Live): state is Extract<Live, { kind: 'answering' | 'resuming' }> {
  return state.kind === 'answering' || state.kind === 'resuming'
}

/** The question sent leaves the timeline when its send fails; with nothing else told, so does the turn. */
function unsent(state: Live): Live {
  if (state.kind !== 'answering') return state
  const entries = state.turn.timeline.entries.filter((entry) => entry.kind !== 'asked')
  if (!entries.some((entry) => entry.kind === 'message')) return IDLE
  return { ...state, turn: { ...state.turn, timeline: { ...state.turn.timeline, entries } } }
}

export function live(state: Live, step: Step): Live {
  switch (step.type) {
    case 'sent': {
      if (state.kind === 'answering') return state
      const turn = state.kind === 'resuming' ? state.turn : NO_TURN
      const entries = [...turn.timeline.entries, { kind: 'asked', id: step.asked } as const]
      return { kind: 'answering', turn: { ...turn, timeline: { ...turn.timeline, entries } } }
    }
    case 'unsent':
      return unsent(state)
    case 'reconnected':
      // A turn that ended while the line was down sends no `turnEnd` to this line: the read says it is over.
      if (state.kind !== 'answering') return state
      return step.inProgress ? { kind: 'resuming', turn: state.turn } : ended(state.turn)
    case 'turn':
      return { kind: 'answering', turn: opened(step, running(state) ? state.turn : NO_TURN) }
    case 'turnEnd':
      return running(state) ? ended(state.turn) : state
    case 'steer':
    case 'steerFailed': {
      if (!running(state)) return state
      const { timeline } = state.turn
      const delivery = step.type === 'steer' ? 'pending' : 'failed'
      const at = timeline.entries.findIndex((entry) => idOf(entry) === step.id)
      const text = step.type === 'steer' ? step.text : ''
      const was = timeline.entries[at]
      // A retry is the same id: it makes a failed entry pending again; a message already told stays.
      const entries =
        was === undefined
          ? [...timeline.entries, { kind: 'local', id: step.id, text, delivery } as const]
          : was.kind === 'local'
            ? timeline.entries.with(at, { ...was, delivery })
            : timeline.entries
      return { ...state, turn: { ...state.turn, timeline: { ...timeline, entries } } }
    }
    case 'returnedShown':
      return state.kind === 'ended' ? { ...state, returned: [] } : state
    default: {
      // What the stream tells after the end begins another turn.
      const turn = running(state) ? state.turn : NO_TURN
      return { kind: 'answering', turn: nextTurn(turn, step) }
    }
  }
}

/**
 * The read joined to the timeline by id (Factory `mergeServerWindow`): a message the read holds is
 * the read's, in the read's place; one only the stream told goes after the one told before it that
 * the read holds, or before the first such one, or last.
 */
export function merge(timeline: Timeline, read: readonly Message[]): readonly Entry[] {
  const entries = read.map(entryOf)
  let after: number | undefined
  let before: Entry[] = []
  for (const entry of timeline.entries) {
    const at = entries.findIndex((each) => idOf(each) === idOf(entry))
    if (at !== -1) {
      entries.splice(at, 0, ...before)
      after = at + before.length + 1
      before = []
    } else if (after === undefined) before.push(entry)
    else entries.splice(after++, 0, entry)
  }
  return [...entries, ...before]
}

/** The timeline of the turn on screen; none before the first. */
export function timelineOf(state: Live): Timeline {
  return state.kind === 'idle' ? NO_TIMELINE : state.turn.timeline
}
