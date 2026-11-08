import type { OpenWrite } from '@conexus/hub-api'
import { AGENTS_CONTROLLER, BUILDER_ROUTES } from '@conexus/hub-api'
import { waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { expect } from 'vitest'
import type { Stored } from '../conversation/messages.ts'
import type { Line } from '../conversation/test-stream.tsx'
import { AGENT, AREA, CHAT } from './test-agents.ts'
import { writer } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'

// The conversation with an agent whose write asks the person (step 24.5), fed with what Mastra's
// controller emitted and stored in `platform/recordings/mastra/approval*.jsonl` (testing T26).

export const SESSION = `*${BUILDER_ROUTES}/agent-controller/${AGENTS_CONTROLLER}/sessions/:id`
const PAGE = `${AREA}/${AGENT}/${CHAT}`
const UPDATED = '2026-11-07T12:00:00.000Z'

/** The agent's conversation open, with `rows` as what the thread kept and `openWrites` as the Hub lists them. */
export function conversation(
  server: ReturnType<typeof setupServer>,
  held: {
    rows?: readonly Stored[]
    openWrites?: OpenWrite[]
    openWritesAnswer?: () => Response | Promise<Response>
  } = {},
) {
  const opened = agentScreens(server).at(PAGE, {
    agents: [writer('ASK')],
    conversations: [
      { id: CHAT, agentId: AGENT, draft: false, title: 'Pedido', updatedAt: UPDATED },
    ],
    openWrites: held.openWrites ?? [],
    openWritesAnswer: held.openWritesAnswer,
  })
  server.use(
    http.get(`${SESSION}/threads/:threadId/messages`, () =>
      HttpResponse.json({ messages: held.rows ?? [] }),
    ),
  )
  return opened
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
