import type { KnownAgentControllerEvent, MastraMessagePart } from '@mastra/client-js'
import type { MessageFile } from './attachments.ts'
import type { Stored, Suspended } from './messages.ts'
import { messageOf, sentOf } from './messages.ts'

type Display = Extract<KnownAgentControllerEvent, { type: 'display_state_changed' }>['displayState']
export type OMProgress = Display['omProgress']
type OMPhase = 'idle' | 'buffering' | 'observing' | 'reflecting'
type MemoryFailure = 'observation' | 'reflection' | 'buffering'

/** A message the person sent while the Builder worked, until the stream says Mastra read it. */
export type Steer = { id: string; content: string; files: readonly MessageFile[] }

/** What a command in progress has said, piece by piece as Mastra sends it, and how it ended. */
export type Running = { output: string; exit?: { code: number; success: boolean } }

/**
 * The conversation as the screen holds it, in the Factory UI's form (`transcript.ts`
 * `transcriptReducer`): Mastra's messages by id in the order they started, the read joined to them,
 * and what the session's display state says (running, the calls waiting, memory).
 */
export type SessionState = {
  messages: readonly Stored[]
  running: boolean
  startedAt: number | null
  suspended: Readonly<Record<string, Suspended>>
  memory: OMProgress | null
  omPhase: OMPhase
  memoryFailed: MemoryFailure | null
  commands: Readonly<Record<string, Running>>
  /** When the screen first heard of each tool call, by its id, epoch ms (Factory `tool_start`). */
  heard: Readonly<Record<string, number>>
  steers: readonly Steer[]
}

export const OPENED: SessionState = {
  messages: [],
  running: false,
  startedAt: null,
  suspended: {},
  memory: null,
  omPhase: 'idle',
  memoryFailed: null,
  commands: {},
  heard: {},
  steers: [],
}

export type Action =
  | { type: 'event'; event: KnownAgentControllerEvent }
  | { type: 'loaded'; messages: readonly Stored[] }
  | { type: 'steer'; steer: Steer }
  | { type: 'unsteered'; id: string }

/** The machine's step is told live as a message of ours that the conversation does not keep. */
function lasts(message: Stored): boolean {
  return !message.id.endsWith(':machine')
}

function upsert(messages: readonly Stored[], message: Stored): readonly Stored[] {
  const at = messages.findIndex((each) => each.id === message.id)
  if (at === -1) return [...messages, message]
  return messages.map((each, index) => (index === at ? message : each))
}

/** A message's update, as the Factory UI folds it (`applyEvent`, `message_update`). */
function updated(
  message: Stored,
  update: Extract<KnownAgentControllerEvent, { type: 'message_update' }>['event'],
): Stored {
  const parts: MastraMessagePart[] = [...message.content.parts]
  if (update.type === 'text-delta') {
    const at = parts.findLastIndex((part) => part.type === 'text')
    const part = parts[at]
    if (part?.type !== 'text') return message
    parts[at] = { ...part, text: part.text + update.delta }
  } else if (update.type === 'reasoning-delta') {
    const part = parts[update.index]
    if (part?.type !== 'reasoning') return message
    parts[update.index] = { ...part, reasoning: part.reasoning + update.delta }
  } else if (update.index <= parts.length) {
    parts[update.index] = update.part
  }
  return { ...message, content: { ...message.content, parts } }
}

function heardOf(state: SessionState, toolCallId: string): SessionState['heard'] {
  return Object.hasOwn(state.heard, toolCallId)
    ? state.heard
    : { ...state.heard, [toolCallId]: Date.now() }
}

/**
 * The calls waiting for the person, by call: Mastra keys them by resource, thread, run and call
 * (core `agent-controller` `pendingSuspensions`), and the transcript knows only the call.
 */
function byCall(pending: Display['pendingSuspensions']): Record<string, Suspended> {
  return Object.fromEntries(Object.values(pending).map((one) => [one.toolCallId, one]))
}

/** The memory's progress as the display state holds it; its buffering shows as the phase. */
function displayed(state: SessionState, display: Display): SessionState {
  const buffering = display.bufferingMessages || display.bufferingObservations
  const omPhase =
    state.omPhase === 'idle' && buffering
      ? 'buffering'
      : state.omPhase === 'buffering' && !buffering
        ? 'idle'
        : state.omPhase
  return {
    ...state,
    running: display.isRunning,
    suspended: byCall(display.pendingSuspensions),
    memory: display.omProgress,
    omPhase,
  }
}

const OM_PHASES: Partial<
  Record<KnownAgentControllerEvent['type'], Pick<SessionState, 'omPhase'> & Partial<SessionState>>
> = {
  om_observation_start: { omPhase: 'observing' },
  om_observation_end: { omPhase: 'idle', memoryFailed: null },
  om_observation_failed: { omPhase: 'idle', memoryFailed: 'observation' },
  om_reflection_start: { omPhase: 'reflecting' },
  om_reflection_end: { omPhase: 'idle', memoryFailed: null },
  om_reflection_failed: { omPhase: 'idle', memoryFailed: 'reflection' },
  om_buffering_start: { omPhase: 'buffering' },
  om_buffering_end: { omPhase: 'idle', memoryFailed: null },
  om_buffering_failed: { omPhase: 'idle', memoryFailed: 'buffering' },
}

function heard(state: SessionState, event: KnownAgentControllerEvent): SessionState {
  switch (event.type) {
    case 'display_state_changed':
      return displayed(state, event.displayState)
    case 'agent_start':
      return { ...state, running: true, startedAt: Date.now() }
    case 'agent_end':
      // A steer the run did not read stays pending: Mastra takes it to the run it opens next.
      return { ...state, running: false, messages: state.messages.filter(lasts) }
    case 'message_start': {
      // A person's message Mastra delivered takes the place of the first steer still pending, in order.
      const steers =
        messageOf(event.message)?.role === 'person' ? state.steers.slice(1) : state.steers
      return { ...state, messages: upsert(state.messages, event.message), steers }
    }
    case 'message_update': {
      const message = state.messages.find((each) => each.id === event.id)
      if (message === undefined) return state
      return { ...state, messages: upsert(state.messages, updated(message, event.event)) }
    }
    case 'tool_start':
      return { ...state, heard: heardOf(state, event.toolCallId) }
    case 'shell_output': {
      const was = state.commands[event.toolCallId]
      const output = (was?.output ?? '') + event.output
      return { ...state, commands: { ...state.commands, [event.toolCallId]: { ...was, output } } }
    }
    case 'command_exit': {
      const was = state.commands[event.toolCallId] ?? { output: '' }
      const exit = { code: event.exitCode, success: event.exitCode === 0 }
      return { ...state, commands: { ...state.commands, [event.toolCallId]: { ...was, exit } } }
    }
    default: {
      const phase = OM_PHASES[event.type]
      return phase === undefined ? state : { ...state, ...phase }
    }
  }
}

/** The words of a person's message, without its files. */
function wordsOf(message: Stored): string | undefined {
  const read = messageOf(message)
  if (read?.role !== 'person') return undefined
  return sentOf(read).text
}

type Invocation = Extract<MastraMessagePart, { type: 'tool-invocation' }>['toolInvocation']

function isTerminal(state: Invocation['state']): boolean {
  return state === 'result' || state === 'output-error' || state === 'output-denied'
}

/**
 * Whether the read already draws what the stream told in a message: Mastra saves a step per message
 * but the resumed run tells its tool call's result in a message of its own, which the store keeps
 * inside the message that called (Factory `claimOnScreenEntries`, `windowCopyCovers`). Only a
 * message with a tool call is judged; every call, text and thought it draws must be in the read, a
 * call settled there if it is settled here.
 */
function drawnBy(read: readonly Stored[], message: Stored): boolean {
  const readParts = read.flatMap((each) => each.content.parts)
  const calls = new Map<string, Invocation>()
  for (const part of readParts)
    if (part.type === 'tool-invocation')
      calls.set(part.toolInvocation.toolCallId, part.toolInvocation)
  let called = false
  for (const part of message.content.parts) {
    if (part.type === 'tool-invocation') {
      called = true
      const there = calls.get(part.toolInvocation.toolCallId)
      if (there === undefined) return false
      if (isTerminal(part.toolInvocation.state) && !isTerminal(there.state)) return false
    } else if (part.type === 'text') {
      const said = part.text.trim()
      if (
        said !== '' &&
        !readParts.some((each) => each.type === 'text' && each.text.startsWith(said))
      )
        return false
    } else if (part.type === 'reasoning') {
      const thought = part.reasoning.trim()
      if (
        thought !== '' &&
        !readParts.some((each) => each.type === 'reasoning' && each.reasoning.startsWith(thought))
      )
        return false
    } else if (part.type.startsWith('data-conexus-') && part.type !== 'data-conexus-thought') {
      return false
    }
  }
  return called
}

/**
 * The held messages and the read as one list, held ones keeping their place as Factory's
 * `mergeServerWindow` does: the read's messages the screen lacks go in front of the next one it
 * has, and those after the last it has go at the end. A read with nothing in common is newer than
 * what the stream told, so what the stream told stays behind it.
 */
function merged(held: readonly Stored[], read: readonly Stored[]): Stored[] {
  const readById = new Map(read.map((message) => [message.id, message]))
  const at = new Map(held.map((message, index) => [message.id, index]))
  if (!read.some((message) => at.has(message.id))) return [...read, ...held]
  const messages: Stored[] = []
  let cursor = 0
  let missing: Stored[] = []
  for (const message of read) {
    const anchor = at.get(message.id)
    if (anchor === undefined) {
      missing.push(message)
      continue
    }
    if (anchor < cursor) continue
    messages.push(...held.slice(cursor, anchor), ...missing)
    missing = []
    cursor = anchor
  }
  messages.push(...held.slice(cursor), ...missing)
  return messages.map((each) => readById.get(each.id) ?? each)
}

/**
 * The read takes the place of what the stream told, joined by id, as Factory's `mergeServerWindow`
 * does: the read is the newest window of the thread, so a message held that the read does not
 * bring stays where it was, in front of the read when it came before the read's first message and
 * behind it when it came after, unless the read already draws all of it. A person's message only
 * the read brings, as after a gap in the stream, confirms the pending steer with its words
 * (Factory `confirmPendingUserMessages`).
 */
function loaded(state: SessionState, read: readonly Stored[]): SessionState {
  const readById = new Map(read.map((message) => [message.id, message]))
  const told = new Set(state.messages.map((message) => message.id))
  const kept = state.messages.filter(
    (message) => readById.has(message.id) || !drawnBy(read, message),
  )
  const messages = merged(kept, read)
  const brought = read.filter((message) => !told.has(message.id)).map(wordsOf)
  const steers = state.steers.filter((steer) => {
    const found = brought.indexOf(steer.content)
    if (found !== -1) brought.splice(found, 1)
    return found === -1
  })
  return { ...state, messages, steers }
}

export function session(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'event':
      return heard(state, action.event)
    case 'loaded':
      return loaded(state, action.messages)
    case 'steer':
      return { ...state, steers: [...state.steers, action.steer] }
    case 'unsteered':
      return { ...state, steers: state.steers.filter((each) => each.id !== action.id) }
    default:
      return action satisfies never
  }
}
