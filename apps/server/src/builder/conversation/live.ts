import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  Message,
  MessagePart,
  PersonId,
} from '@conexus/hub-api'
import { EventId, MessageId, TurnFailureCode } from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Turn } from '../model-accounts/public.ts'
import type { Place } from './parts.ts'
import { modelOf, partOf } from './parts.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }
/** An event as the stream sends it, with the id a reconnect names it by. */
export type Said = { id: EventId; event: ConversationEvent }
export type Listener = (said: Said) => void

/** The person's questions not yet saved by Mastra, kept on the thread so a crash loses none. */
export const QUESTION_KEY = 'conexus.questions'
/** One kept question, named by its message's Idempotency-Key. */
export const Question = z.object({ key: z.uuid(), content: z.string(), at: z.iso.datetime() })
export type Question = z.infer<typeof Question>

/**
 * The id of the person's message sent with `key`, made by the server: Mastra saves the message
 * under it, and a read shows the question kept before that save under it too.
 */
export function questionId(conversationId: ConversationId, key: string): MessageId {
  return MessageId.parse(`${conversationId}:${key}`)
}

/** The failures of the turns, kept on the thread so a reload reads each where it happened. */
export const TURN_FAILURES_KEY = 'conexus.turnFailures'
/** A turn's failure, after the person's message of that turn. */
export const TurnFailure = z.object({ after: MessageId, code: TurnFailureCode })
export type TurnFailure = z.infer<typeof TurnFailure>

/**
 * The most events a turn keeps for a reconnect to resume from; past it, a reconnect reads the turn
 * so far instead.
 */
export const TURN_EVENTS_KEPT = 10_000

/** A run Mastra woke for one of this conversation's messages, until its end. */
type Run = { turn: Turn; ended: () => void }

/**
 * A turn of the Builder's, from the message that opened it to its end, and the last one once over:
 * its answer so far, the events it said, and the thinking whose clock runs.
 */
type TurnLog = {
  id: string
  startedAt: string
  answer: Message
  /** The person's message the turn answers, as a read shows it, once known. */
  after: MessageId | undefined
  /** Every event said, each named `<id>.<its number>`, up to `TURN_EVENTS_KEPT` of them. */
  said: number
  events: ConversationEvent[]
  thinking: { id: string; since: number } | undefined
  failureKept: boolean
  ended: boolean
}

/** A conversation open in this process: its controller session and its turn. */
export type Live = {
  conversationId: ConversationId
  owner: Owner
  log: FailureLog
  session: Session
  listeners: Set<Listener>
  turn: TurnLog | undefined
  /** The turns of the messages sent and not yet over: their run, or the one they joined, runs. */
  asked: Set<Turn>
  /** The runs a message of this conversation woke (Mastra's `wake`), by Mastra's run id. */
  runs: Map<string, Run>
  /**
   * The last run that ended before its message learned its id, as Mastra's own wait allows
   * (`waitForAcceptedRunCompletion`): its message does not wait for an end already past, and ends
   * the turn itself, since only it knows which turn the run was.
   */
  unclaimed: { run: string; reason: Ending['reason'] } | undefined
  /** The questions on the thread, and the thread's writes in flight, one after the other. */
  questions: Question[]
  kept: Promise<void>
  unsubscribe: () => void
}

/** The id of the turn's `n`th event: the turn, and the event's place in it. */
function eventId(turn: TurnLog, n: number): EventId {
  return EventId.parse(`${turn.id}.${n}`)
}

function say(live: Live, turn: TurnLog, event: ConversationEvent): void {
  turn.said += 1
  if (turn.said <= TURN_EVENTS_KEPT) turn.events.push(event)
  const said = { id: eventId(turn, turn.said), event }
  for (const listener of live.listeners) listener(said)
}

function newTurn(): TurnLog {
  const id = randomUUID()
  const startedAt = new Date().toISOString()
  const answer: Message = {
    id: MessageId.parse(id),
    role: 'builder',
    parts: [],
    model: null,
    createdAt: startedAt,
  }
  return {
    id,
    startedAt,
    answer,
    after: undefined,
    said: 0,
    events: [],
    thinking: undefined,
    failureKept: false,
    ended: false,
  }
}

/** The turn in progress, or a new one, which the stream opens with its `turn`. */
export function openTurn(live: Live): TurnLog {
  if (live.turn !== undefined && !live.turn.ended) return live.turn
  const turn = newTurn()
  live.turn = turn
  const { answer, startedAt } = turn
  say(live, turn, { type: 'turn', message: structuredClone(answer), startedAt })
  return turn
}

/** The turn an event outside every turn belongs to, such as a title after a restart. */
function lastTurn(live: Live): TurnLog {
  live.turn ??= { ...newTurn(), ended: true }
  return live.turn
}

/** A part with an `id` replaces the one with the same; any other comes at the end. */
function put(live: Live, turn: TurnLog, part: MessagePart): void {
  const { parts } = turn.answer
  const at = 'id' in part ? parts.findIndex((each) => 'id' in each && each.id === part.id) : -1
  if (at === -1) parts.push(part)
  else parts[at] = part
  say(live, turn, { type: 'part', part })
}

/** The thinking in progress ends with the first part after it: how long it took, by our clock. */
function settleThinking(live: Live, turn: TurnLog): void {
  const { thinking } = turn
  if (thinking === undefined) return
  turn.thinking = undefined
  const seconds = Math.ceil((Date.now() - thinking.since) / 1000)
  put(live, turn, { type: 'reasoning', id: thinking.id, state: 'completed', seconds })
}

function onPart(live: Live, turn: TurnLog, part: unknown, place: Place) {
  const shown = partOf(part, place)
  if (shown === undefined) return
  if (shown.type === 'reasoning') {
    if (turn.answer.parts.some((each) => each.type === 'reasoning' && each.id === shown.id)) return
    settleThinking(live, turn)
    turn.thinking = { id: shown.id, since: Date.now() }
    put(live, turn, { ...shown, state: 'running' })
    return
  }
  settleThinking(live, turn)
  // The text arrives by its deltas.
  if (shown.type !== 'text') put(live, turn, shown)
}

function appendText(answer: Message, delta: string): void {
  const last = answer.parts.at(-1)
  if (last?.type === 'text') last.text += delta
  else answer.parts.push({ type: 'text', text: delta })
}

function onMessageEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    const turn = openTurn(live)
    turn.answer.model = modelOf(event.message) ?? turn.answer.model
    const messageId = MessageId.parse(event.message.id)
    for (const [index, part] of event.message.content.parts.entries()) {
      onPart(live, turn, part, { messageId, index })
    }
  } else if (event.type === 'message_update' && live.turn !== undefined && !live.turn.ended) {
    const turn = live.turn
    if (event.event.type === 'text-delta') {
      settleThinking(live, turn)
      appendText(turn.answer, event.event.delta)
      say(live, turn, { type: 'text', delta: event.event.delta })
    } else if (event.event.type === 'part') {
      const messageId = MessageId.parse(event.id)
      onPart(live, turn, event.event.part, { messageId, index: event.event.index })
    }
  }
}

/**
 * What a stream that opens reads first: the events after the last one it read, when that one is
 * of the turn in progress or of the last one and every later event is kept; otherwise the turn in
 * progress so far, or nothing when none runs. An id from elsewhere, of another conversation too,
 * names nothing here (security S10).
 */
export function resumeOf(live: Live, lastEventId: EventId | null): Said[] {
  const turn = live.turn
  if (turn === undefined) return []
  const [id, number, ...rest] = lastEventId?.split('.') ?? []
  const seen = id === turn.id && rest.length === 0 ? Number(number) : Number.NaN
  const keptEvery = turn.said === turn.events.length
  if (keptEvery && Number.isSafeInteger(seen) && seen >= 1 && seen <= turn.said) {
    return turn.events.slice(seen).map((event, at) => ({ id: eventId(turn, seen + at + 1), event }))
  }
  if (turn.ended) return []
  const { answer, startedAt } = turn
  return [
    {
      id: eventId(turn, turn.said),
      event: { type: 'turn', message: structuredClone(answer), startedAt },
    },
  ]
}

/** The controller's events as the person's: text, thinking, tools, notices, the title, the end. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'info') {
    const turn = openTurn(live)
    turn.answer.parts.push({ type: 'notice', text: event.message })
    say(live, turn, { type: 'notice', text: event.message })
  } else if (event.type === 'thread_title_updated') {
    say(live, lastTurn(live), { type: 'title', title: event.title })
  } else if (event.type === 'agent_start') {
    openTurn(live)
  } else if (event.type === 'agent_end') {
    // Mastra still names the ending run when it says so (`finishAgentRun`).
    const runId = live.session.run.getRunId()
    const run = runId === null ? undefined : live.runs.get(runId)
    if (runId !== null) live.runs.delete(runId)
    if (runId !== null && run === undefined && live.asked.size > 0) {
      live.unclaimed = { run: runId, reason: event.reason }
      return
    }
    endTurn(live, { reason: event.reason, turn: run?.turn })
    run?.ended()
  } else onMessageEvent(live, event)
}

type Ending = {
  reason: 'complete' | 'aborted' | 'error' | 'suspended' | undefined
  turn: Turn | undefined
  unexpected?: TurnFailureCode
}

/** Why a failed turn failed, by how the queue ended its run's turn, never the provider's text. */
function failureOf(ending: Ending): TurnFailureCode | undefined {
  if (ending.reason !== 'error') return undefined
  if (ending.unexpected !== undefined) return ending.unexpected
  return ending.turn?.outcome === 'exhausted' ? 'MODEL_NO_ACCOUNT' : 'MODEL_CALL_FAILED'
}

/** Keeps the turn's failure on the thread, once per message (`after`), after the writes before it. */
function keepFailure(live: Live, turn: TurnLog, code: TurnFailureCode): Promise<void> {
  const { after } = turn
  if (after === undefined || turn.failureKept) return Promise.resolve()
  turn.failureKept = true
  return queued(live, async () => {
    const read = z
      .array(TurnFailure)
      .safeParse(await live.session.thread.getSetting({ key: TURN_FAILURES_KEY }))
    const others = (read.success ? read.data : []).filter((each) => each.after !== after)
    await live.session.thread.setSetting({
      key: TURN_FAILURES_KEY,
      value: [...others, { after, code }],
    })
  }).catch((cause: unknown) => logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })))
}

/**
 * Keeps a failed turn's failure before Mastra says its run ended, so the read a screen makes at the
 * end finds it with the turn's messages, which Mastra saves after the end.
 */
export async function beforeAgentEnd(live: Live, reason: Ending['reason']): Promise<void> {
  const runId = live.session.run.getRunId()
  const run = runId === null ? undefined : live.runs.get(runId)
  const code = failureOf({ reason, turn: run?.turn })
  if (run === undefined || code === undefined || live.turn === undefined) return
  await keepFailure(live, live.turn, code)
}

/**
 * The end of a turn, said once: a failed one first says why, as a part, by how the queue ended
 * its run's turn (security S41); `suspended` cannot happen, since the Builder has no tool that
 * waits. A failure not kept before the end, as a run whose message did not know it yet, is kept now;
 * one that could not be kept is logged, and the turn still ends.
 */
export function endTurn(live: Live, ending: Ending): void {
  const turn = openTurn(live)
  turn.ended = true
  settleThinking(live, turn)
  const ended =
    ending.reason === 'error' || ending.reason === 'aborted' ? ending.reason : 'complete'
  const code = failureOf(ending)
  if (code !== undefined) {
    put(live, turn, { type: 'failure', code })
    void keepFailure(live, turn, code)
  }
  const { conversationId, owner } = live
  const fields = {
    companyId: owner.companyId,
    conversationId,
    reason: ended,
    ...(code && { code }),
  }
  live.log.info(fields, 'CONVERSATION_TURN_ENDED')
  say(live, turn, { type: 'turnEnd', reason: ended })
}

/**
 * Keeps the person's question on the thread (Mastra saves a run's messages only at its end): with
 * the others of the run in progress, or alone when no other message is in flight, since the
 * earlier ones are saved. The writes go one after the other, so the last one holds every question.
 */
export function keepQuestion(live: Live, question: Question): Promise<void> {
  const running = live.asked.size > 0 || live.session.stream.isActive()
  const others = live.questions.filter((each) => each.key !== question.key)
  live.questions = running ? [...others, question] : [question]
  const value = live.questions
  return queued(live, () => live.session.thread.setSetting({ key: QUESTION_KEY, value }))
}

/** A write to the thread after the ones before it, which the next write waits for in turn. */
function queued(live: Live, write: () => Promise<void>): Promise<void> {
  // biome-ignore lint/plugin: a write that failed went to its own caller; this one only waits for the queue to settle (code C37)
  const kept = live.kept.catch(() => undefined).then(write)
  live.kept = kept
  return kept
}
