import { BUILDER_CONTROLLER, BUILDER_ROUTES } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'

/** A message as the sweep writes it: whose, its parts, and the model that answered. */
export type Said = {
  id: string
  role: 'person' | 'builder'
  parts: readonly unknown[]
  model?: string | null
  createdAt: string
}

/** The message as Mastra stores it and its transcript route serves it. */
export function storedOf(said: Said) {
  const [provider, ...name] = (said.model ?? '').split('/')
  const metadata = said.model ? { provider, modelId: name.join('/') } : undefined
  return {
    id: said.id,
    role: said.role === 'person' ? 'user' : 'assistant',
    createdAt: said.createdAt,
    content: { format: 2, parts: said.parts, ...(metadata ? { metadata } : {}) },
  }
}

/** Mastra's display state as the stream opens with it, the fields the screen reads given. */
function displayOf(fields: Record<string, unknown> = {}) {
  return {
    type: 'display_state_changed',
    displayState: {
      isRunning: false,
      currentMessage: null,
      pendingSuspensions: {},
      tasks: [],
      omProgress: null,
      bufferingMessages: false,
      bufferingObservations: false,
      ...fields,
    },
  }
}

/**
 * The calls waiting for the person as Mastra's display state holds them: keyed by resource, thread,
 * run and call (measured on Mastra 1.79's stream), each naming its call.
 */
export function parkedOf(...calls: { toolCallId: string; toolName: string; args: unknown }[]) {
  return Object.fromEntries(
    calls.map((call) => [
      JSON.stringify(['company:c1:person:p1', 'thread-1', 'run-1', call.toolCallId]),
      { ...call, suspendPayload: call.args },
    ]),
  )
}

/**
 * The conversation's session on Mastra's routes: its transcript, and its stream, which opens with
 * the display state and then says `events`; the stream ends, and the screen opens it again.
 */
export function sessionReplies(
  conversationId: string,
  options: { messages?: readonly Said[]; display?: Record<string, unknown>; events?: unknown[] },
): Replies {
  const session = `${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${conversationId}`
  return {
    [`GET ${session}/threads/${conversationId}/messages`]: {
      status: 200,
      json: { messages: (options.messages ?? []).map(storedOf) },
    },
    [`GET ${session}/stream`]: {
      status: 200,
      events: [displayOf(options.display), ...(options.events ?? [])],
    },
  }
}
