import type { ConversationEvent, MastraPart } from '@conexus/hub-api'
import { z } from 'zod'

/** The model's text the events said, whole: the deltas and the text parts, in order. */
export function textsOf(events: ConversationEvent[]): string[] {
  return events.flatMap((event) => {
    if (event.type !== 'message_update') return []
    const { event: update } = event
    if (update.type === 'text-delta') return [update.delta]
    return update.type === 'part' && update.part.type === 'text' ? [update.part.text] : []
  })
}

/** Every part the events said, in order: those of a message started and those a message was updated with. */
export function partsOf(events: ConversationEvent[]): MastraPart[] {
  return events.flatMap((event) => {
    if (event.type === 'message_start') return event.message.parts
    return event.type === 'message_update' && event.event.type === 'part' ? [event.event.part] : []
  })
}

/** The `data` of each part of ours named `type` that the events said, in order. */
export function dataOf(events: ConversationEvent[], type: `data-${string}`): unknown[] {
  return partsOf(events).flatMap((part) => (part.type === type ? [part.data] : []))
}

const Coded = z.object({ code: z.string() })
const Worded = z.object({ text: z.string() })

/** The failures a turn said, in order. */
export function failuresOf(events: ConversationEvent[]): string[] {
  return dataOf(events, 'data-conexus-failure').flatMap((data) => {
    const read = Coded.safeParse(data)
    return read.success ? [read.data.code] : []
  })
}

export function noticesIn(parts: MastraPart[]): string[] {
  return parts.flatMap((part) => {
    const read = part.type === 'data-conexus-notice' ? Worded.safeParse(part.data) : undefined
    return read?.success ? [read.data.text] : []
  })
}

/** The notices of a turn, in order. */
export function noticesOf(events: ConversationEvent[]): string[] {
  return noticesIn(partsOf(events))
}
