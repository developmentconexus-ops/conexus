import { HttpResponse } from 'msw'
import type { Stored } from './messages.ts'
import { Display, recordedEvent } from './test-recorded.ts'

/** Mastra's display state as its stream sends it, the fields the screen reads given. */
export function displayOf(fields: Record<string, unknown> = {}) {
  const idle = recordedEvent('abort', Display)
  return {
    ...idle,
    displayState: { ...idle.displayState, currentMessage: null, ...fields },
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

export type Line = {
  emit: (event: object) => void
  write: (text: string) => void
  close: () => void
}

/** A stream the screen reads, opening with Mastra's display state. */
export function openLine(seed: object): { line: Line; response: Response } {
  const encoder = new TextEncoder()
  let sink: ReadableStreamDefaultController<Uint8Array> | undefined
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      sink = controller
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(seed)}\n\n`))
    },
  })
  function write(text: string) {
    try {
      sink?.enqueue(encoder.encode(text))
    } catch {
      // browser closed
    }
  }
  const line: Line = {
    emit: (event) => write(`data: ${JSON.stringify(event)}\n\n`),
    write,
    close: () => {
      try {
        sink?.close()
      } catch {
        // closed already
      }
    },
  }
  return {
    line,
    response: new HttpResponse(body, { headers: { 'content-type': 'text/event-stream' } }),
  }
}

/** The Builder's message as Mastra stores it, answered by the conversation's model. */
export function builderSaid(text: string, id = 'builder-1'): Stored {
  return {
    id,
    role: 'assistant',
    createdAt: '2026-10-19T12:02:00.000Z',
    content: {
      parts: [{ type: 'text', text }],
      metadata: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
    },
  }
}

/** The person's message as Mastra stores it. */
export function personSaid(text: string, id = 'person-1'): Stored {
  return {
    id,
    role: 'user',
    createdAt: '2026-10-19T12:01:00.000Z',
    content: { parts: [{ type: 'text', text }] },
  }
}
