import type {
  ConversationEvent,
  MastraPart,
  Message,
  MessageId,
  ModelId,
  RunId,
} from '@conexus/hub-api'
import { EventId } from '@conexus/hub-api'
import { z } from 'zod'
import type { ShellTail } from './shell.ts'
import type { TurnTally } from './turn-line.ts'

/** An event as the stream sends it, with the id a reconnect names it by. */
export type Said = { id: EventId; event: ConversationEvent }
export type Listener = (said: Said) => void

/** The most events of a turn kept to resume a stream that reconnects; past it, a reconnect gets the turn so far. */
const RESUME_EVENTS = 10_000

/**
 * A turn of the Builder's, from the message that opened it to its end, and the last one once over:
 * Mastra's messages of the turn as the stream said them, the parts of ours, and the events that a
 * reconnect resumes from. Its id is its run's.
 */
export type TurnLog = {
  id: RunId | undefined
  /** The id of the answer as one message: the run's, or a made one for a turn with no run. */
  answerId: MessageId
  startedAt: string
  /** Mastra's messages of the turn, as the stream said them, in the order they began. */
  steps: Message[]
  /** The parts of ours, one message named by the turn (`data-conexus-*`). */
  extras: MastraPart[]
  model: ModelId | null
  /** The person's message the turn answers, as a read shows it, once known. */
  after: MessageId | undefined
  /** The last events said, numbered from the turn's first. */
  said: Said[]
  next: number
  /** When each reasoning began, by its message and index, until the first part after it. */
  thinking: Map<string, number>
  /** The output of the commands in progress, by the tool call that runs them. */
  shells: Map<string, ShellTail>
  tally: TurnTally
  /** The request that began the turn, for its log line. */
  traceId: string | undefined
  failureKept: boolean
  /** The calls the turn parked; what each waits with is Mastra's (`pendingSuspensions`). */
  parked: Set<string>
  /** When the message of ours was first saved: it keeps the time at each save. */
  extrasAt: Date | undefined
  ended: boolean
}

/** What saying an event needs of a conversation open in this process. */
export type Speaker = { listeners: Set<Listener> }

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
const SeenEvent = z
  .string()
  .transform((id) => id.split('.'))
  .pipe(z.tuple([z.uuid(), EventPlace]))

/** Says an event of the turn to every open stream, and keeps it for a stream that reconnects. */
export function say(speaker: Speaker, turn: TurnLog, event: ConversationEvent): void {
  const runId = turn.id
  if (runId === undefined) return
  turn.next += 1
  const said = { id: eventId(runId, turn.next), event }
  turn.said.push(said)
  if (turn.said.length > 2 * RESUME_EVENTS) turn.said = turn.said.slice(-RESUME_EVENTS)
  for (const listener of speaker.listeners) listener(said)
}

/**
 * The turn so far as its later events address it: Mastra's messages by their ids, each with the
 * calls it left waiting, then ours as one message under the turn's id.
 */
export function messagesOf(turn: TurnLog, suspended: Message['suspended']): Message[] {
  const waiting = new Map(Object.entries(suspended))
  const steps = turn.steps.map((step) => {
    const own = step.parts.flatMap((part) => {
      if (part.type !== 'tool-invocation') return []
      const call = waiting.get(part.toolInvocation.toolCallId)
      return call === undefined ? [] : [call]
    })
    for (const call of own) waiting.delete(call.toolCallId)
    const suspended = Object.fromEntries(own.map((call) => [call.toolCallId, call]))
    return { ...step, suspended: { ...step.suspended, ...suspended } }
  })
  const ours: Message = {
    id: turn.answerId,
    role: 'builder',
    parts: turn.extras,
    suspended: Object.fromEntries(waiting),
    model: turn.model,
    createdAt: turn.startedAt,
  }
  return [...steps, ours]
}

/**
 * What a stream that opens reads first (card, criterion 31): the events after the last one it saw,
 * when that one is of this turn and still kept; otherwise the turn so far if it is not over; or
 * nothing, since a read of the conversation tells what is over. An id from elsewhere names
 * nothing here (security S10).
 */
export function catchUp(
  turn: TurnLog | undefined,
  lastEventId: EventId | null,
  suspended: Message['suspended'],
): Said[] {
  if (turn?.id === undefined) return []
  const seen = SeenEvent.safeParse(lastEventId)
  if (seen.success && seen.data[0] === turn.id) {
    const firstN = turn.next - turn.said.length + 1
    if (seen.data[1] >= firstN - 1) return turn.said.filter((each) => nOf(each) > seen.data[1])
  }
  if (turn.ended) return []
  const messages = messagesOf(turn, suspended)
  const event = { type: 'turn', messages, startedAt: turn.startedAt } as const
  return [{ id: eventId(turn.id, turn.next), event }]
}

function nOf(said: Said): number {
  const place = SeenEvent.parse(said.id)
  return place[1]
}
