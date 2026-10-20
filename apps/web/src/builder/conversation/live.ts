import type { ConversationEvent, Message, MessagePart } from '@conexus/hub-api'

/**
 * The Builder's answer as the stream tells it. `answering` holds the parts so far and when the
 * server began the turn, which is `null` until the stream says; `resuming` keeps them once the line
 * was opened again, for the events the stream says it missed; `ended` keeps the parts until the
 * conversation's read holds the saved answer, which Mastra writes after the turn ends.
 */
export type Live =
  | { kind: 'idle' }
  | { kind: 'answering'; parts: MessagePart[]; startedAt: string | null }
  | { kind: 'resuming'; parts: MessagePart[]; startedAt: string | null }
  | { kind: 'ended'; parts: MessagePart[] }

export const IDLE: Live = { kind: 'idle' }

/**
 * What the screen adds to the stream's events: a message is on its way, the Hub refused it, or the
 * line was opened again, after which the stream tells what the line missed, or the turn anew.
 */
export type Step =
  | ConversationEvent
  | { type: 'sent' }
  | { type: 'unsent' }
  | { type: 'reconnected' }

function appended(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts.at(-1)
  return last?.type === 'text'
    ? [...parts.slice(0, -1), { type: 'text', text: last.text + delta }]
    : [...parts, { type: 'text', text: delta }]
}

/** A part with an `id` takes the place of the one with the same `id`; any other comes last. */
function placed(parts: MessagePart[], part: MessagePart): MessagePart[] {
  const at = 'id' in part ? parts.findIndex((one) => 'id' in one && one.id === part.id) : -1
  return at === -1 ? [...parts, part] : parts.with(at, part)
}

/**
 * The answer in progress, or a new one: an event outside a turn starts one, as another tab's send.
 * An answer the line is resuming goes on with the events it missed.
 */
function inProgress(state: Live): Extract<Live, { kind: 'answering' }> {
  return state.kind === 'answering' || state.kind === 'resuming'
    ? { kind: 'answering', parts: state.parts, startedAt: state.startedAt }
    : { kind: 'answering', parts: [], startedAt: null }
}

/** The answer after one more step; the stream's `turn` replaces what the screen had. */
export function live(state: Live, step: Step): Live {
  switch (step.type) {
    // Sent before the Hub answers: the stream may already be telling the answer by then.
    case 'sent':
      return state.kind === 'answering' ? state : { kind: 'answering', parts: [], startedAt: null }
    case 'unsent':
      return state.kind === 'answering' && state.parts.length === 0 ? IDLE : state
    case 'reconnected':
      return state.kind === 'answering'
        ? { kind: 'resuming', parts: state.parts, startedAt: state.startedAt }
        : state
    case 'turn':
      return { kind: 'answering', parts: step.message.parts, startedAt: step.startedAt }
    case 'text': {
      const answer = inProgress(state)
      return { ...answer, parts: appended(answer.parts, step.delta) }
    }
    case 'part': {
      const answer = inProgress(state)
      return { ...answer, parts: placed(answer.parts, step.part) }
    }
    case 'notice': {
      const answer = inProgress(state)
      return { ...answer, parts: [...answer.parts, { type: 'notice', text: step.text }] }
    }
    case 'turnEnd':
      return state.kind === 'answering' || state.kind === 'resuming'
        ? { kind: 'ended', parts: state.parts }
        : state
    case 'title':
      return state
    default:
      return step satisfies never
  }
}

/**
 * The parts the screen draws after the conversation's messages, and whether they are still
 * arriving: an answer ended, or resumed, shows until the read holds a message of the Builder at its
 * end.
 */
export function shownAnswer(
  state: Live,
  messages: readonly Message[],
): { parts: MessagePart[]; streaming: boolean } | null {
  switch (state.kind) {
    case 'idle':
      return null
    case 'answering':
      return { parts: state.parts, streaming: true }
    case 'resuming':
    case 'ended':
      return state.parts.length === 0 || messages.at(-1)?.role === 'builder'
        ? null
        : { parts: state.parts, streaming: false }
    default:
      return state satisfies never
  }
}
