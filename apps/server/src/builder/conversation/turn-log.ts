import type { ConversationEvent, Message, MessageId, RunId } from '@conexus/hub-api'
import { applyEvent, EventId } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { ShellTail } from './shell.ts'
import type { TurnTally } from './turn-line.ts'

/** An event as the stream sends it, with the id a reconnect names it by. */
export type Said = { id: EventId; event: ConversationEvent }
export type Listener = (said: Said) => void

/** The longest text one event carries: the journal keeps the answer in pieces of this size. */
const TEXT_CHUNK = 200

/** Keeps an event in the run's journal and answers its number, or `undefined` once the run is not ours. */
export type Journal = (runId: RunId, event: ConversationEvent) => Promise<number | undefined>

/**
 * A turn of the Builder's, from the message that opened it to its end, and the last one once over:
 * its answer so far, the text not yet said, the events on their way to the journal, and the
 * thinking whose clock runs. Its id is its run's.
 */
export type TurnLog = {
  id: RunId | undefined
  startedAt: string
  answer: Message
  /** The person's message the turn answers, as a read shows it, once known. */
  after: MessageId | undefined
  /** Text said by the model and not yet an event: it is one when it fills a piece or its part ends. */
  buffer: string
  /** The journal's writes and the stream's sends, one after the other. */
  queue: Promise<void>
  thinking: { id: string; since: number } | undefined
  /** The output of the commands in progress, by the tool call that runs them. */
  shells: Map<string, ShellTail>
  tally: TurnTally
  /** The request that began the turn, for its log line. */
  traceId: string | undefined
  failureKept: boolean
  ended: boolean
}

/** What saying an event needs of a conversation open in this process. */
export type Speaker = {
  listeners: Set<Listener>
  journal: Journal
  log: FailureLog
  /** Stops the turn once its run is no longer this copy's. */
  lose: () => void
}

/** The id of a run's `n`th event: the run, and the event's place in it. */
export function eventId(runId: RunId, n: number): EventId {
  return EventId.parse(`${runId}.${n}`)
}

const EventPlace = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.int())
/** What an `eventId` names, read back strictly: its run, and its place in it. */
export const SeenEvent = z
  .string()
  .transform((id) => id.split('.'))
  .pipe(z.tuple([z.uuid(), EventPlace]))

function send(speaker: Speaker, turn: TurnLog, event: ConversationEvent): void {
  const runId = turn.id
  if (runId === undefined) return
  turn.queue = turn.queue.then(async () => {
    const n = await speaker.journal(runId, event).then(
      (written) => written,
      (cause: unknown) => {
        logFailure(speaker.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
        return -1
      },
    )
    if (n === undefined) return speaker.lose()
    if (n < 0) return
    const said = { id: eventId(runId, n), event }
    for (const listener of speaker.listeners) listener(said)
  })
}

/** Says the text held back as one event. */
export function flushText(speaker: Speaker, turn: TurnLog): void {
  if (turn.buffer === '') return
  const delta = turn.buffer
  turn.buffer = ''
  send(speaker, turn, { type: 'text', delta })
}

/**
 * Says an event of the turn. Text waits until it fills a piece of `TEXT_CHUNK` characters or its
 * part ends; any other event, and the turn's end, say what waits before them, so the order holds.
 */
export function say(speaker: Speaker, turn: TurnLog, event: ConversationEvent): void {
  if (event.type !== 'text') {
    flushText(speaker, turn)
    send(speaker, turn, event)
    return
  }
  turn.buffer += event.delta
  while (turn.buffer.length >= TEXT_CHUNK) {
    const delta = turn.buffer.slice(0, TEXT_CHUNK)
    turn.buffer = turn.buffer.slice(TEXT_CHUNK)
    send(speaker, turn, { type: 'text', delta })
  }
}

/** The turn a run's kept events add up to, as the screen folds them: its snapshot. */
export function snapshotOf(
  runId: RunId,
  rows: { n: number; event: ConversationEvent }[],
): Said | undefined {
  const last = rows.at(-1)
  if (last === undefined) return undefined
  // A resumed run says its `turn` again: the answer it gives replaces the one the dead copy began.
  const from = rows.findLastIndex((row) => row.event.type === 'turn')
  const first = rows[from]?.event
  if (first?.type !== 'turn') return undefined
  const message = structuredClone(first.message)
  for (const { event } of rows.slice(from + 1)) {
    if (event.type === 'text' || event.type === 'part' || event.type === 'notice') {
      message.parts = applyEvent(message.parts, event)
    }
  }
  return {
    id: eventId(runId, last.n),
    event: { type: 'turn', message, startedAt: first.startedAt },
  }
}

/** The events of `said` that come after `last` in its run: what a catch-up read already holds is not said twice. */
export function after(last: Said | undefined, said: Said[]): Said[] {
  const seen = SeenEvent.safeParse(last?.id)
  if (!seen.success) return said
  return said.filter((each) => {
    const place = SeenEvent.safeParse(each.id)
    return !place.success || place.data[0] !== seen.data[0] || place.data[1] > seen.data[1]
  })
}
