import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConversationId,
  Message,
  MessagePart,
  PartEvent,
  PersonId,
  RunId,
  TurnFailureCode,
} from '@conexus/hub-api'
import { applyEvent, MessageId, machinePhaseLasts } from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Phase as MachinePhase } from '../machine/public.ts'
import type { Turn } from '../model-accounts/public.ts'
import type { Outcome } from '../runs/public.ts'
import type { Question } from './kept.ts'
import { keepFailure, keepPart, keptInList, queued, THINKING_KEY, ThoughtTime } from './kept.ts'
import type { Place } from './parts.ts'
import { fileOf, modelOf, partOf } from './parts.ts'
import { ShellTail } from './shell.ts'
import { TurnTally, turnLine } from './turn-line.ts'
import type { Journal, Listener, TurnLog } from './turn-log.ts'
import { flushText, say } from './turn-log.ts'

export type { Question } from './kept.ts'
export { keepQuestion, questionId } from './kept.ts'
export type { Listener } from './turn-log.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }

/** A question or a plan the turn waits on. */
export type Card = Extract<MessagePart, { type: 'question' | 'plan' }>

type ToolPart = Extract<MessagePart, { type: 'tool' }>

/** A card the turn waits on: the Mastra run that parked on it, and whether an answer claimed it. */
type Pending = { card: Card; run: string | undefined; claimed: boolean }
/** The version a saved turn reached, with its file counts. */
type SavedVersion = Extract<Outcome, { kind: 'saved' }>['version']

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
  /** The cards the turn waits on, by the tool call that asked, and how long each waits. */
  pending: Map<string, Pending>
  /** The wait ran out: the cancellation of the cards is an expiry, not a stop. */
  expiring: boolean
  /** The run a message steers, until the run it starts takes its place (card, criterion 18). */
  steering: { run: Run | undefined } | undefined
  /** The questions on the thread, and the thread's writes in flight, one after the other. */
  questions: Question[]
  kept: Promise<void>
  /** The run of the message in progress: ends and saves it when Mastra's run is about to end. */
  run:
    | {
        id: RunId
        traceId: string
        /** What Mastra needs of the turn to go on after an answer or a message. */
        context: RequestContext
        finish: (reason: string) => Promise<Outcome | 'gone'>
        /** The run waits on the person's answer, or goes on after it. */
        waiting: (waiting: boolean) => Promise<boolean>
      }
    | undefined
  /** Why the turn ended badly, for its end to say: a save that failed, or a question that expired (card, the failures table). */
  saveFailure: TurnFailureCode | undefined
  /** The version the turn saved, for its end to say. */
  saved: SavedVersion | undefined
  unsubscribe: () => void
}

function newTurn(id: RunId | undefined, traceId?: string): TurnLog {
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
    flusher: undefined,
    queue: Promise.resolve(),
    thinking: undefined,
    shells: new Map(),
    tally: new TurnTally(),
    traceId,
    failureKept: false,
    ended: false,
  }
}

/** The turn in progress, or a new one, which the stream opens with its `turn`. */
export function openTurn(live: Live): TurnLog {
  if (live.turn !== undefined && !live.turn.ended) return live.turn
  const turn = newTurn(live.run?.id, live.run?.traceId)
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
export function tell(live: Live, turn: TurnLog, event: PartEvent): void {
  turn.answer.parts = applyEvent(turn.answer.parts, event)
  say(live, turn, event)
}

/** The machine's step, told as the part that says what the turn waits for; a replaced machine and a restart last. */
export function tellMachine(live: Live, phase: MachinePhase): void {
  const turn = openTurn(live)
  const part: MessagePart = { type: 'machine', phase }
  tell(live, turn, { type: 'part', part })
  if (machinePhaseLasts(phase)) void keepPart(live, turn, part)
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

/** The tool part the turn last told for a call, which holds what its command printed so far. */
function toldTool(turn: TurnLog, call: string): ToolPart | undefined {
  return turn.answer.parts.find(
    (part): part is ToolPart => part.type === 'tool' && part.id === call,
  )
}

/**
 * A command's call says its output only once it has a result, and never its exit code: until then
 * its row keeps what the turn heard of it (`onShellEvent`).
 */
function withHeard(turn: TurnLog, tool: ToolPart): ToolPart {
  const told = toldTool(turn, tool.id)?.detail
  if (tool.detail?.kind !== 'command' || told?.kind !== 'command' || tool.state !== 'running') {
    return tool
  }
  return { ...tool, detail: { ...tool.detail, output: told.output, cut: told.cut } }
}

function exitHeard(turn: TurnLog, call: string): number | null {
  const told = toldTool(turn, call)?.detail
  return told?.kind === 'command' ? told.exitCode : null
}

function onPart(live: Live, turn: TurnLog, part: unknown, place: Place) {
  const read = partOf(part, place, (call) => exitHeard(turn, call))
  const shown = read?.type === 'tool' ? withHeard(turn, read) : read
  if (shown === undefined) return
  if (shown.type === 'reasoning') {
    if (turn.answer.parts.some((each) => each.type === 'reasoning' && each.id === shown.id)) return
    settleThinking(live, turn)
    turn.thinking = { id: shown.id, since: Date.now() }
    tell(live, turn, { type: 'part', part: { ...shown, state: 'running' } })
    return
  }
  settleThinking(live, turn)
  // The text arrives by its deltas; a question or a plan, by the suspension that asks it and the
  // answer or cancellation that closes it, which know what Mastra's message does not (expiry).
  if (shown.type === 'text' || shown.type === 'question' || shown.type === 'plan') return
  tell(live, turn, { type: 'part', part: shown })
  if (shown.type === 'tool' && shown.state === 'error') turn.tally.failed(shown.kind)
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

/** A run ended: its turn ends with it, or waits for the run it never learned the id of. */
export function endRun(live: Live, reason: Ending['reason'], parked?: string): void {
  // Mastra still names the ending run when it says so (`finishAgentRun`); a parked run is named by its suspension.
  const runId = parked ?? live.session.run.getRunId()
  const run = runId === null ? undefined : live.runs.get(runId)
  if (runId !== null) live.runs.delete(runId)
  if (runId !== null && run === undefined && live.asked.size > 0) {
    live.unclaimed = { run: runId, reason }
    return
  }
  endTurn(live, { reason, turn: run?.turn })
  run?.ended()
}

/** The controller's events as the person's: text, thinking, tools, notices, the title, the end. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'info') {
    tell(live, openTurn(live), { type: 'notice', text: event.message })
  } else if (event.type === 'thread_title_updated') {
    say(live, lastTurn(live), { type: 'title', title: event.title })
  } else if (event.type === 'agent_start') {
    openTurn(live)
    // The run a message started carries the turn of the one it steered.
    const runId = live.session.run.getRunId()
    if (live.steering?.run !== undefined && runId !== null) live.runs.set(runId, live.steering.run)
    live.steering = undefined
  } else if (event.type === 'agent_end') {
    // A run parked on a question or a plan is not over: its turn goes on once it is answered.
    if (event.reason !== 'suspended') endRun(live, event.reason)
  } else if (event.type === 'usage_update') {
    live.turn?.tally.step(event.usage.totalTokens)
  } else if (event.type === 'shell_output' || event.type === 'command_exit') {
    onShellEvent(live, event)
  } else if (event.type === 'tool_input_start' || event.type === 'message_end') {
    // A text part ends where a tool call or the message begins to end: what waits of it is said.
    if (live.turn !== undefined && !live.turn.ended) flushText(live, live.turn)
  } else onMessageEvent(live, event)
}

/** A command's output, kept to its last lines in its row: said while it runs, and once more when it exits. */
function onShellEvent(
  live: Live,
  event: Extract<AgentControllerEvent, { type: 'shell_output' | 'command_exit' }>,
): void {
  const turn = live.turn
  if (turn === undefined || turn.ended) return
  const tool = toldTool(turn, event.toolCallId)
  if (tool?.detail?.kind !== 'command') return
  const tail = turn.shells.get(event.toolCallId) ?? new ShellTail()
  turn.shells.set(event.toolCallId, tail)
  if (event.type === 'shell_output') tail.add(event.output)
  const exited = event.type === 'command_exit'
  if (exited) turn.shells.delete(event.toolCallId)
  const heard = exited ? tail.tail() : tail.running()
  if (heard === undefined) return
  const exitCode = exited ? event.exitCode : null
  const detail = { ...tool.detail, ...heard, exitCode }
  tell(live, turn, { type: 'part', part: { ...tool, detail } })
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
 * Keeps a failed turn's failure, and waits for the thinking times kept before it, before Mastra
 * says its run ended, so the read a screen makes at the end finds them with the turn's messages,
 * which Mastra saves after the end.
 */
export async function beforeAgentEnd(live: Live, reason: Ending['reason']): Promise<void> {
  if (reason === 'suspended') return
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
    if (live.turn !== undefined) await keepPart(live, live.turn, versionPart(outcome.version))
  }
  const code = live.saveFailure ?? failureOf({ reason, turn: run?.turn })
  if (code !== undefined && live.turn !== undefined && (run !== undefined || live.saveFailure)) {
    await keepFailure(live, live.turn, code)
  }
  // A write of nothing, queued last, settles once every write before it has.
  await queued(live, () => Promise.resolve())
}

function versionPart(saved: SavedVersion): MessagePart {
  return { type: 'version', ...saved }
}

/**
 * The end of a turn, said once: a failed one first says why, as a part, by how the queue ended
 * its run's turn (security S41). A failure not kept before the end, as a run whose message did not know it yet, is kept now;
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
    tell(live, turn, { type: 'part', part: versionPart(live.saved) })
    live.saved = undefined
  }
  if (code !== undefined) {
    tell(live, turn, { type: 'part', part: { type: 'failure', code } })
    void keepFailure(live, turn, code)
  }
  const { conversationId, owner } = live
  const line = turnLine({
    ...{ runId: turn.id, traceId: turn.traceId, startedAt: turn.startedAt, tally: turn.tally },
    ...{ end: ended, errorCode: code },
  })
  const fields = { companyId: owner.companyId, conversationId, reason: ended, ...line }
  live.log.info(fields, 'CONVERSATION_TURN_ENDED')
  say(live, turn, { type: 'turnEnd', reason: ended })
}
