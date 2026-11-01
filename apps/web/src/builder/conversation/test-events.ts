import type { KnownAgentControllerEvent, MastraMessagePart } from '@mastra/client-js'
import {
  AgentEnd,
  AgentStart,
  MessageStart,
  MessageUpdate,
  recordedEvent,
} from './test-recorded.ts'
import { displayOf } from './test-stream.tsx'

export { signalStarted } from './test-recorded.ts'

/**
 * Mastra's session events as its stream sends them, in the shapes the Hub's tests measured
 * (`conversation-steer.test.ts`, `platform/recordings/mastra/abort.jsonl`).
 */
export const MSG_ID = 'builder-msg-1'

export const AGENT_START = recordedEvent('abort', AgentStart)
export const RUNNING = displayOf({ isRunning: true })
export const IDLE = displayOf()

export function agentEnd(reason = 'complete') {
  return { ...recordedEvent('abort', AgentEnd), reason }
}

/** A step of the Builder's opening, as Mastra opens it, with the parts a test gives it. */
export function stepStarted(id = MSG_ID, parts?: MastraMessagePart[]) {
  const start = recordedEvent('abort', MessageStart, (event) => event.message.role === 'assistant')
  const { content } = start.message
  return {
    ...start,
    message: {
      ...start.message,
      id,
      createdAt: '2026-10-19T12:02:00.000Z',
      content: {
        ...content,
        ...(parts ? { parts } : {}),
        metadata: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
      },
    },
  }
}

export function textDelta(delta: string, id = MSG_ID) {
  const update = recordedEvent('abort', MessageUpdate, (event) => event.event.type === 'text-delta')
  return { ...update, id, event: { ...update.event, delta } }
}

export function updatePart(part: MastraMessagePart, index = 0, id = MSG_ID) {
  const update = recordedEvent('cited', MessageUpdate, (event) => event.event.type === 'part')
  return { ...update, id, event: { ...update.event, index, part } }
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

/** A tool call of any tool, running (no result) or answered. */
export function toolCall(toolName: string, args: unknown, result?: unknown): MastraMessagePart {
  return {
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: 'tool-1',
      toolName,
      state: result === undefined ? 'call' : 'result',
      args,
      result,
    },
  }
}

/** The memory's observation failing, typed by Mastra's own event (no recording holds one). */
export function observationFailed(): KnownAgentControllerEvent {
  return { type: 'om_observation_failed', cycleId: 'cycle-1', error: 'ECONNRESET', durationMs: 5 }
}

/** The screen hearing a tool call begin, as Mastra tells it (`tool_start`): the row then counts as live. */
export function toolStarted(toolName: string, args: unknown): KnownAgentControllerEvent {
  return { type: 'tool_start', toolCallId: 'tool-1', toolName, args }
}
