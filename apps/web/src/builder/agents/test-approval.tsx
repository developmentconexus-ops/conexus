import type { WrittenRow } from '@conexus/hub-api'
import { AGENTS_CONTROLLER, BUILDER_ROUTES, OperationId, ToolCallId } from '@conexus/hub-api'
import { waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { expect } from 'vitest'
import { z } from 'zod'
import type { Stored } from '../conversation/messages.ts'
import { IsStored, recordedRun } from '../conversation/test-recorded.ts'
import type { Line } from '../conversation/test-stream.tsx'
import { AGENT, AREA, CHAT, MATRIZ } from './test-agents.ts'
import { writer } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'

// The conversation with an agent whose write asks the person (step 24.5), fed with what Mastra's
// controller emitted and stored in `platform/recordings/mastra/approval*.jsonl` (testing T26).

export const SESSION = `*${BUILDER_ROUTES}/agent-controller/${AGENTS_CONTROLLER}/sessions/:id`
const PAGE = `${AREA}/${AGENT}/${CHAT}`
const UPDATED = '2026-11-07T12:00:00.000Z'

/** The agent's conversation open, with `rows` as what the thread kept and `writes` as the Hub lists them. */
export function conversation(
  server: ReturnType<typeof setupServer>,
  held: {
    rows?: readonly Stored[]
    /** What the version fixes in the write (the nota modelo). */
    bound?: Record<string, unknown>
    writes?: WrittenRow[]
    writesAnswer?: () => Response | Promise<Response>
  } = {},
) {
  const opened = agentScreens(server).at(PAGE, {
    agents: [writer('ASK', held.bound)],
    conversations: [
      { id: CHAT, agentId: AGENT, draft: false, title: 'Pedido', updatedAt: UPDATED },
    ],
    writes: held.writes ?? [],
    writesAnswer: held.writesAnswer,
  })
  server.use(
    http.get(`${SESSION}/threads/:threadId/messages`, () =>
      HttpResponse.json({ messages: held.rows ?? [] }),
    ),
  )
  return opened
}

/**
 * The record's row for the write the recording `scenario` asked about, as the Hub lists it: a
 * launched write a person approved, unless `fields` say otherwise.
 */
export function rowOf(scenario: string, fields: Partial<WrittenRow> = {}): WrittenRow {
  const event = recordedRun(scenario).events.find(asks)
  return {
    toolCallId: ToolCallId.parse(
      event === undefined ? undefined : Reflect.get(event, 'toolCallId'),
    ),
    connectionId: MATRIZ,
    operation: OperationId.parse('lancarPedido'),
    state: 'DONE',
    sentAt: UPDATED,
    mark: 'Conexus 7F3A2B1C',
    approved: true,
    message: null,
    ...fields,
  }
}

/** The stored rows with every value `change` names replaced: a test overlays what it is about and keeps the rest as Mastra stored it. */
export function reshaped(
  rows: readonly Stored[],
  change: (key: string, value: unknown) => unknown,
): Stored[] {
  const swapped: unknown = JSON.parse(JSON.stringify(rows), change)
  return z.array(IsStored).parse(swapped)
}

/** The stored rows with the arguments of every call replaced by `args`: what the model filled, for a card read after a reload. */
export function withArgs(rows: readonly Stored[], args: object): Stored[] {
  return reshaped(rows, (key, value) => (key === 'args' ? args : value))
}

/** The line of the open stream, once the screen opened it. */
export async function lineOf(opened: { lines: Line[] }): Promise<Line> {
  await waitFor(() => expect(opened.lines.length).toBeGreaterThan(0))
  const line = opened.lines.at(-1)
  if (line === undefined) throw new Error('the stream is not open')
  return line
}

function typeOf(event: object): unknown {
  return Reflect.get(event, 'type')
}

/** Whether the event is the display state holding a call that waits for the person's approval. */
export function holdsApproval(event: object): boolean {
  const display: unknown = Reflect.get(event, 'displayState')
  const held: unknown =
    typeof display === 'object' && display !== null
      ? Reflect.get(display, 'pendingApprovals')
      : undefined
  return typeof held === 'object' && held !== null && Object.keys(held).length > 0
}

/** Whether the event is Mastra saying a call asks the person. */
export function asks(event: object): boolean {
  return typeOf(event) === 'tool_approval_required'
}

/** Whether the event is the end of a call. */
export function ends(event: object): boolean {
  return typeOf(event) === 'tool_end'
}

/** Tells the stream the events up to and including the first one `stop` picks; the rest are returned for later. */
export function tell(line: Line, events: readonly object[], stop: (event: object) => boolean) {
  const at = events.findIndex(stop)
  const upTo = at === -1 ? events.length : at + 1
  for (const event of events.slice(0, upTo)) line.emit(event)
  return events.slice(upTo)
}
