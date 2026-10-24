import type { ConversationEvent, MastraPart, Message } from '@conexus/hub-api'
import { MessageId } from '@conexus/hub-api'
import { builderSaid } from './test-hub.tsx'

/** The events of a turn as the server says them: the turn, Mastra's steps, and our parts. */
export const MSG_ID = 'builder-msg-1'
const TURN_ID = 'run-1'
const TURN_STARTED_AT = '2026-10-19T12:01:00.000Z'

/** The turn the stream opens with, and the step of Mastra's it tells next, as the server says them. */
export function opening(): ConversationEvent {
  return {
    type: 'turn',
    messages: [{ ...builderSaid(''), id: MessageId.parse(TURN_ID), parts: [] }],
    startedAt: TURN_STARTED_AT,
  }
}

export function stepStarted(id = MSG_ID): ConversationEvent {
  return {
    type: 'message_start',
    message: { ...builderSaid(''), id: MessageId.parse(id), parts: [] },
  }
}

/** The step as Mastra saves it: under the id its `message_start` told. */
export function savedStep(text: string): Message {
  return { ...builderSaid(text), id: MessageId.parse(MSG_ID) }
}

/** Ours as the server saves it: under the run's id, as the stream told it. */
export function savedOurs(parts: MastraPart[]): Message {
  return { ...builderSaid(''), id: MessageId.parse(TURN_ID), parts }
}

/** A part of ours, told as an update of the turn's own message. */
export function ours(part: MastraPart, index = 0): ConversationEvent {
  return updatePart(part, index, TURN_ID)
}

export function textDelta(delta: string, id = MSG_ID): ConversationEvent {
  return {
    type: 'message_update',
    id: MessageId.parse(id),
    event: { type: 'text-delta', delta },
  }
}

export function updatePart(part: MastraPart, index = 0, id = MSG_ID): ConversationEvent {
  return {
    type: 'message_update',
    id: MessageId.parse(id),
    event: { type: 'part', index, part },
  }
}

export function readPage(url: string, title?: string): MastraPart {
  return {
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: 'tool-1',
      toolName: 'web_fetch',
      state: title === undefined ? 'call' : 'result',
      args: { url },
      result: title ? { title } : undefined,
    },
  }
}
