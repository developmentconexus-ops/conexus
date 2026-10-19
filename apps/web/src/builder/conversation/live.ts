import type { ConversationEvent, MessagePart } from '@conexus/hub-api'

/**
 * What the Builder is answering now, as the stream tells it: the parts so far (`null` when no
 * answer is in progress), and whether the last answer failed.
 */
export type Live = { parts: MessagePart[] | null; failed: boolean }

export const IDLE: Live = { parts: null, failed: false }

/** What the screen adds to the stream's events: a message is on its way, or the Hub refused it. */
export type Step = ConversationEvent | { type: 'sent' } | { type: 'unsent' }

function appended(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts.at(-1)
  return last?.type === 'text'
    ? [...parts.slice(0, -1), { type: 'text', text: last.text + delta }]
    : [...parts, { type: 'text', text: delta }]
}

/** The answer in progress after one more step; the stream's `turn` replaces what the screen had. */
export function live(state: Live, step: Step): Live {
  const parts = state.parts ?? []
  switch (step.type) {
    // Sent before the Hub answers: the stream may already be telling the answer by then.
    case 'sent':
      return { parts, failed: false }
    case 'unsent':
      return state.parts?.length === 0 ? IDLE : state
    case 'turn':
      return { parts: step.message.parts, failed: false }
    case 'text':
      return { ...state, parts: appended(parts, step.delta) }
    case 'part':
      return { ...state, parts: [...parts, step.part] }
    case 'notice':
      return { ...state, parts: [...parts, { type: 'notice', text: step.text }] }
    case 'failure':
      return { ...state, failed: true }
    case 'turnEnd':
      return { ...state, parts: null }
    case 'title':
      return state
  }
}

/** Whether the answer in progress has any text to show yet. */
export function hasText(parts: readonly MessagePart[] | null): boolean {
  return parts?.some((part) => part.type === 'text' && part.text !== '') ?? false
}
