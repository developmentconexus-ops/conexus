import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  Message,
  PartEvent,
  PersonId,
  RunId,
} from '@conexus/hub-api'
import { applyEvent, MessageId, TurnFailureCode } from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Phase as MachinePhase } from '../machine/public.ts'
import type { Turn } from '../model-accounts/public.ts'
import type { Outcome } from '../runs/public.ts'
import type { Place } from './parts.ts'
import { fileOf, modelOf, partOf } from './parts.ts'
import { ShellTail } from './shell.ts'
import type { Journal, Listener, TurnLog } from './turn-log.ts'
import { flushText, say } from './turn-log.ts'

export type { Listener, Said } from './turn-log.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }
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

/** How long each thinking took, kept on the thread so a read shows it as the stream did (#176). */
export const THINKING_KEY = 'conexus.thinking'
/** One thinking's time, named by its part's `id`. */
export const ThoughtTime = z.object({ id: z.string(), seconds: z.number().int().nonnegative() })
export type ThoughtTime = z.infer<typeof ThoughtTime>

/**
 * The most events a turn keeps for a reconnect to resume from; past it, a reconnect reads the turn
 * so far instead.
 */

/** A run Mastra woke for one of this conversation's messages, until its end. */
type Run = { turn: Turn; ended: () => void }

/** A conversation open in this process: its controller session and its turn. */
export type Live = {
  conversationId: ConversationId
  owner: Owner
  log: FailureLog
  session: Session
  listeners: Set<Listener>
  /** Keeps an event in the run's journal (data D25). */
  journal: Journal
  /** Stops the turn once its run is not this copy's: Mastra's run aborts and no more is said. */
  lose: () => void
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
  /** The run of the message in progress: ends and saves it when Mastra's run is about to end. */
  run: { id: RunId; finish: (reason: string) => Promise<Outcome | 'gone'> } | undefined
  /** Why saving failed, for the turn's end to say (card, the failures table). */
  saveFailure: TurnFailureCode | undefined
  /** The version the turn saved, for its end to say. */
  saved: number | undefined
  unsubscribe: () => void
}

function newTurn(id: RunId | undefined): TurnLog {
  const startedAt = new Date().toISOString()
  const answer: Message = {
    id: MessageId.parse(id ?? randomUUID()),
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
    buffer: '',
    queue: Promise.resolve(),
    thinking: undefined,
    shells: new Map(),
    failureKept: false,
    ended: false,
  }
}

/** The turn in progress, or a new one, which the stream opens with its `turn`. */
export function openTurn(live: Live): TurnLog {
  if (live.turn !== undefined && !live.turn.ended) return live.turn
  const turn = newTurn(live.run?.id)
  live.turn = turn
  const { answer, startedAt } = turn
  say(live, turn, { type: 'turn', message: structuredClone(answer), startedAt })
  return turn
}

/** The turn an event outside every turn belongs to, such as a title after a restart. */
function lastTurn(live: Live): TurnLog {
  live.turn ??= { ...newTurn(undefined), ended: true }
  return live.turn
}

/** An event that changes the answer: folded into it as the screen folds it, then said. */
function tell(live: Live, turn: TurnLog, event: PartEvent): void {
  turn.answer.parts = applyEvent(turn.answer.parts, event)
  say(live, turn, event)
}

/** The machine's step, told as the part that says what the turn waits for. */
export function tellMachine(live: Live, phase: MachinePhase): void {
  tell(live, openTurn(live), { type: 'part', part: { type: 'machine', phase } })
}

/** The thinking in progress ends with the first part after it: how long it took, by our clock. */
function settleThinking(live: Live, turn: TurnLog): void {
  const { thinking } = turn
  if (thinking === undefined) return
  turn.thinking = undefined
  const seconds = Math.ceil((Date.now() - thinking.since) / 1000)
  tell(live, turn, {
    type: 'part',
    part: { type: 'reasoning', id: thinking.id, state: 'completed', seconds },
  })
  void keptInList(live, {
    key: THINKING_KEY,
    list: z.array(ThoughtTime),
    item: { id: thinking.id, seconds },
    same: (each) => each.id === thinking.id,
  })
}

function onPart(live: Live, turn: TurnLog, part: unknown, place: Place) {
  const shown = partOf(part, place)
  if (shown === undefined) return
  if (shown.type === 'reasoning') {
    if (turn.answer.parts.some((each) => each.type === 'reasoning' && each.id === shown.id)) return
    settleThinking(live, turn)
    turn.thinking = { id: shown.id, since: Date.now() }
    tell(live, turn, { type: 'part', part: { ...shown, state: 'running' } })
    return
  }
  settleThinking(live, turn)
  // The text arrives by its deltas.
  if (shown.type === 'text') return
  tell(live, turn, { type: 'part', part: shown })
  const file = shown.type === 'tool' ? fileOf(shown) : undefined
  if (file !== undefined) tell(live, turn, { type: 'part', part: file })
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
      tell(live, turn, { type: 'text', delta: event.event.delta })
    } else if (event.event.type === 'part') {
      const messageId = MessageId.parse(event.id)
      onPart(live, turn, event.event.part, { messageId, index: event.event.index })
    }
  }
}

/** The controller's events as the person's: text, thinking, tools, notices, the title, the end. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'info') {
    tell(live, openTurn(live), { type: 'notice', text: event.message })
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
  } else if (event.type === 'shell_output' || event.type === 'command_exit') {
    onShellEvent(live, event)
  } else onMessageEvent(live, event)
}

/** A command's output is kept to its last lines and said once, when it exits. */
function onShellEvent(
  live: Live,
  event: Extract<AgentControllerEvent, { type: 'shell_output' | 'command_exit' }>,
): void {
  const turn = live.turn
  if (turn === undefined || turn.ended) return
  const tail = turn.shells.get(event.toolCallId) ?? new ShellTail()
  turn.shells.set(event.toolCallId, tail)
  if (event.type === 'shell_output') {
    tail.add(event.output)
    return
  }
  turn.shells.delete(event.toolCallId)
  tell(live, turn, { type: 'part', part: tail.part(event.toolCallId, event.exitCode) })
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

/**
 * Keeps `item` in the thread's list under `key`, in place of the one it is the `same` as, after the
 * writes before it. A write that fails is logged and the turn goes on without it.
 */
function keptInList<T>(
  live: Live,
  kept: { key: string; list: z.ZodType<T[]>; item: T; same: (each: T) => boolean },
): Promise<void> {
  const { key, list, item, same } = kept
  return queued(live, async () => {
    const read = list.safeParse(await live.session.thread.getSetting({ key }))
    const others = (read.success ? read.data : []).filter((each) => !same(each))
    await live.session.thread.setSetting({ key, value: [...others, item] })
  }).catch((cause: unknown) => logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })))
}

/** Keeps the turn's failure on the thread, once per message (`after`). */
function keepFailure(live: Live, turn: TurnLog, code: TurnFailureCode): Promise<void> {
  const { after } = turn
  if (after === undefined || turn.failureKept) return Promise.resolve()
  turn.failureKept = true
  return keptInList(live, {
    key: TURN_FAILURES_KEY,
    list: z.array(TurnFailure),
    item: { after, code },
    same: (each) => each.after === after,
  })
}

/**
 * Keeps a failed turn's failure, and waits for the thinking times kept before it, before Mastra
 * says its run ended, so the read a screen makes at the end finds them with the turn's messages,
 * which Mastra saves after the end.
 */
export async function beforeAgentEnd(live: Live, reason: Ending['reason']): Promise<void> {
  const runId = live.session.run.getRunId()
  const run = runId === null ? undefined : live.runs.get(runId)
  // A save that throws is this turn's failure, said and logged here: Mastra would print the listener's
  // error raw, and the turn would end without saying why.
  const outcome = await live.run?.finish(reason ?? 'unknown').then(
    (finished) => finished,
    (cause: unknown) => {
      logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
      live.saveFailure = 'INTERNAL_UNEXPECTED'
      return undefined
    },
  )
  if (outcome !== undefined && outcome !== 'gone' && outcome.kind === 'failed') {
    live.saveFailure = outcome.code
  }
  if (outcome !== undefined && outcome !== 'gone' && outcome.kind === 'saved') {
    live.saved = outcome.version
  }
  const code = live.saveFailure ?? failureOf({ reason, turn: run?.turn })
  if (code !== undefined && live.turn !== undefined && (run !== undefined || live.saveFailure)) {
    await keepFailure(live, live.turn, code)
  }
  // A write of nothing, queued last, settles once every write before it has.
  await queued(live, () => Promise.resolve())
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
  const code = live.saveFailure ?? failureOf(ending)
  live.saveFailure = undefined
  if (live.saved !== undefined) {
    tell(live, turn, { type: 'part', part: { type: 'version', number: live.saved, changed: true } })
    live.saved = undefined
  }
  if (code !== undefined) {
    tell(live, turn, { type: 'part', part: { type: 'failure', code } })
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
