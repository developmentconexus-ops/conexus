import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { KnownAgentControllerEvent } from '@mastra/client-js'
import { z } from 'zod'
import type { Stored } from './messages.ts'

const RECORDINGS = join(import.meta.dirname, '../../../../server/src/platform/recordings/mastra')

export const AgentStart = z.looseObject({ type: z.literal('agent_start') })
export const AgentEnd = z.looseObject({ type: z.literal('agent_end'), reason: z.string() })
export const Display = z.looseObject({
  type: z.literal('display_state_changed'),
  displayState: z.record(z.string(), z.unknown()),
})
export const MessageStart = z.looseObject({
  type: z.literal('message_start'),
  message: z.looseObject({
    role: z.string(),
    content: z.looseObject({ parts: z.array(z.unknown()) }),
  }),
})
export const MessageUpdate = z.looseObject({
  type: z.literal('message_update'),
  event: z.looseObject({ type: z.string() }),
})

export const TaskUpdated = z.looseObject({
  type: z.literal('task_updated'),
  tasks: z.array(z.looseObject({ status: z.string() })),
})

const Row = z.looseObject({ kind: z.string(), event: z.unknown().optional() })

/**
 * The first event of a shape that Mastra's AgentController emitted in a recording made by
 * `npm run record`, as a fresh copy: a test overlays what it is about and keeps the rest as Mastra
 * sent it (testing T26). The data is the server's `platform/recordings/mastra/`, read once here.
 */
export function recordedEvent<S extends z.ZodType>(
  scenario: string,
  shape: S,
  where: (event: z.output<S>) => boolean = () => true,
): z.output<S> {
  for (const line of readFileSync(join(RECORDINGS, `${scenario}.jsonl`), 'utf8').split('\n')) {
    if (line === '') continue
    const row = Row.parse(JSON.parse(line))
    const event = row.kind === 'event' ? shape.safeParse(row.event) : undefined
    if (event?.success && where(event.data)) return event.data
  }
  throw new Error(`${scenario}.jsonl holds no such event`)
}

const Signal = z.looseObject({
  content: z.looseObject({
    parts: z.array(z.looseObject({ data: z.record(z.string(), z.unknown()) })),
  }),
})

/** What the person sent, as Mastra tells it on the stream: a signal, never a stored user message. */
export function signalStarted(
  id: string,
  contents: string,
  createdAt = '2026-10-19T12:01:00.000Z',
) {
  const start = recordedEvent('abort', MessageStart, (event) => event.message.role === 'signal')
  const { content } = Signal.parse(start.message)
  const data = { ...content.parts[0]?.data, id, contents, createdAt }
  return {
    ...start,
    message: {
      ...start.message,
      id,
      createdAt,
      content: {
        ...content,
        parts: [{ type: 'data-user-message', data }],
        metadata: { signal: data },
      },
    },
  }
}

const IsEvent = z.custom<KnownAgentControllerEvent>(
  (value) => typeof value === 'object' && value !== null && 'type' in value,
)
const IsStored = z.custom<Stored>(
  (value) => typeof value === 'object' && value !== null && 'id' in value && 'content' in value,
)
const RecordedRow = Row.extend({ table: z.string().optional(), row: z.unknown().optional() })

/**
 * Every event Mastra's controller emitted in a recording, in order, and the messages it stored as
 * the transcript route reads them: what a screen is fed live and what it reads again.
 */
export function recordedRun(scenario: string): {
  events: KnownAgentControllerEvent[]
  read: Stored[]
} {
  const events: KnownAgentControllerEvent[] = []
  const read: Stored[] = []
  for (const line of readFileSync(join(RECORDINGS, `${scenario}.jsonl`), 'utf8').split('\n')) {
    if (line === '') continue
    const row = RecordedRow.parse(JSON.parse(line))
    if (row.kind === 'event') events.push(IsEvent.parse(row.event))
    else if (row.kind === 'row' && row.table === 'message') read.push(IsStored.parse(row.row))
  }
  return { events, read }
}
