import type { ConversationEvent, Message, MessagePart, TurnFailureCode } from '@conexus/hub-api'

/**
 * The Builder's answer as the stream tells it. `answering` holds the parts so far; `ended` keeps
 * them until the conversation's read holds the saved answer, which Mastra writes after the turn
 * ends when it was stopped. `failure` is the code the stream gave for a turn that failed.
 */
export type Live =
  | { kind: 'idle' }
  | { kind: 'answering'; parts: MessagePart[]; failure: TurnFailureCode | null }
  | { kind: 'ended'; parts: MessagePart[]; failure: TurnFailureCode | null }

export const IDLE: Live = { kind: 'idle' }

/**
 * What the screen adds to the stream's events: a message is on its way, the Hub refused it, or the
 * line was opened again, after which only the stream's `turn` tells an answer in progress.
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

/** The answer in progress, or a new one: an event outside a turn starts one, as another tab's send. */
function inProgress(state: Live): Extract<Live, { kind: 'answering' }> {
  return state.kind === 'answering' ? state : { kind: 'answering', parts: [], failure: null }
}

/** The answer after one more step; the stream's `turn` replaces what the screen had. */
export function live(state: Live, step: Step): Live {
  switch (step.type) {
    // Sent before the Hub answers: the stream may already be telling the answer by then.
    case 'sent':
      return inProgress(state)
    case 'unsent':
      return state.kind === 'answering' && state.parts.length === 0 ? IDLE : state
    case 'reconnected':
      return IDLE
    case 'turn':
      return { kind: 'answering', parts: step.message.parts, failure: null }
    case 'text': {
      const answer = inProgress(state)
      return { ...answer, parts: appended(answer.parts, step.delta) }
    }
    case 'part': {
      const answer = inProgress(state)
      return { ...answer, parts: [...answer.parts, step.part] }
    }
    case 'notice': {
      const answer = inProgress(state)
      return { ...answer, parts: [...answer.parts, { type: 'notice', text: step.text }] }
    }
    case 'failure':
      return { ...inProgress(state), failure: step.code }
    case 'turnEnd':
      return state.kind === 'answering' ? { ...state, kind: 'ended' } : state
    case 'title':
      return state
    default:
      return step satisfies never
  }
}

/**
 * The parts the screen draws after the conversation's messages, and whether they are still
 * arriving: an ended answer shows until the read holds a message of the Builder at its end.
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
    case 'ended':
      return state.parts.length === 0 || messages.at(-1)?.role === 'builder'
        ? null
        : { parts: state.parts, streaming: false }
    default:
      return state satisfies never
  }
}

/** Whether the answer in progress has any text to show yet. */
export function hasText(parts: readonly MessagePart[]): boolean {
  return parts.some((part) => part.type === 'text' && part.text !== '')
}
