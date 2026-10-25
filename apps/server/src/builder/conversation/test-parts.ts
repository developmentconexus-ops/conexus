import { FailureData, NoticeData } from '@conexus/hub-api'
import type { AgentControllerWireEvent, MastraMessagePart } from '@mastra/core/agent-controller'

type StreamEvent = AgentControllerWireEvent

/** The model's text the events said, whole: the deltas and the text parts, in order. */
export function textsOf(events: StreamEvent[]): string[] {
  return events.flatMap((event) => {
    if (event.type !== 'message_update') return []
    const { event: update } = event
    if (update.type === 'text-delta') return [update.delta]
    return update.type === 'part' && update.part.type === 'text' ? [update.part.text] : []
  })
}

/** Every part the events said, in order: those of a message started and those a message was updated with. */
export function partsOf(events: StreamEvent[]): MastraMessagePart[] {
  return events.flatMap((event) => {
    if (event.type === 'message_start') return event.message.content.parts
    return event.type === 'message_update' && event.event.type === 'part' ? [event.event.part] : []
  })
}

/** The `data` of each part of ours named `type` that the events said, in order. */
export function dataOf(events: StreamEvent[], type: `data-${string}`): unknown[] {
  return partsOf(events).flatMap((part) => (part.type === type ? [part.data] : []))
}

/** The failures among the parts, in order. */
export function failuresIn(parts: MastraMessagePart[]): string[] {
  return parts.flatMap((part) => {
    const read = part.type === 'data-conexus-failure' ? FailureData.safeParse(part.data) : undefined
    return read?.success ? [read.data.code] : []
  })
}

/** The failures a turn said, in order. */
export function failuresOf(events: StreamEvent[]): string[] {
  return failuresIn(partsOf(events))
}

export function noticesIn(parts: MastraMessagePart[]): string[] {
  return parts.flatMap((part) => {
    const read = part.type === 'data-conexus-notice' ? NoticeData.safeParse(part.data) : undefined
    return read?.success ? [read.data.text] : []
  })
}

/** The notices of a turn, in order. */

type Said = { role: string; parts: MastraMessagePart[] }

/**
 * The messages the events said, by id in the order they started, each folded as the Factory UI's
 * transcript folds them (`transcript.ts` `applyEvent`): a text delta onto the last text part, a
 * reasoning delta and a part at their index.
 */
export function messagesIn(events: StreamEvent[]): Map<string, Said> {
  const messages = new Map<string, Said>()
  for (const event of events) {
    if (event.type === 'message_start') {
      const { role, content } = event.message
      messages.set(event.message.id, { role, parts: [...content.parts] })
    }
    if (event.type !== 'message_update') continue
    const parts = messages.get(event.id)?.parts
    if (parts === undefined) continue
    const { event: update } = event
    if (update.type === 'text-delta') {
      const at = parts.findLastIndex((part) => part.type === 'text')
      const part = parts[at]
      if (part?.type === 'text') parts[at] = { ...part, text: part.text + update.delta }
    } else if (update.type === 'reasoning-delta') {
      const part = parts[update.index]
      if (part?.type === 'reasoning') {
        parts[update.index] = { ...part, reasoning: part.reasoning + update.delta }
      }
    } else if (update.index <= parts.length) {
      parts[update.index] = update.part
    }
  }
  return messages
}

/** Every part of the messages the events said, each message as its last telling left it, as the screen shows them. */
export function shownPartsOf(events: StreamEvent[]): MastraMessagePart[] {
  return [...messagesIn(events).values()].flatMap((message) => message.parts)
}
