import type { MastraMessagePart } from '@mastra/client-js'
import { displayOf } from './test-stream.tsx'

/**
 * Mastra's session events as its stream sends them, in the shapes the Hub's tests measured
 * (`conversation-steer.test.ts`, `platform/recordings/mastra/abort.jsonl`).
 */
export const MSG_ID = 'builder-msg-1'

export const AGENT_START = { type: 'agent_start' }
export const RUNNING = displayOf({ isRunning: true })
export const IDLE = displayOf()

export function agentEnd(reason = 'complete') {
  return { type: 'agent_end', reason }
}

/** A step of the Builder's opening, with Mastra's empty text part. */
export function stepStarted(
  id = MSG_ID,
  parts: MastraMessagePart[] = [{ type: 'text', text: '' }],
) {
  return {
    type: 'message_start',
    message: {
      id,
      role: 'assistant',
      createdAt: '2026-10-19T12:02:00.000Z',
      content: {
        format: 2,
        parts,
        metadata: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
      },
    },
  }
}

/** What the person sent into the running run, as Mastra tells it: a signal. */
export function signalStarted(id: string, contents: string) {
  const data = {
    id,
    type: 'user',
    tagName: 'user',
    contents,
    attributes: { delivery: 'while-active' },
  }
  return {
    type: 'message_start',
    message: {
      id,
      role: 'signal',
      createdAt: '2026-10-19T12:02:30.000Z',
      content: {
        format: 2,
        parts: [{ type: 'data-user-message', data }],
        metadata: { signal: data },
      },
    },
  }
}

export function textDelta(delta: string, id = MSG_ID) {
  return { type: 'message_update', id, event: { type: 'text-delta', delta } }
}

export function updatePart(part: MastraMessagePart, index = 0, id = MSG_ID) {
  return { type: 'message_update', id, event: { type: 'part', index, part } }
}

export function readPage(url: string, title?: string): MastraMessagePart {
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
