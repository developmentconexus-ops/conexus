import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConversationId,
  FailureData,
  Kept,
  MachineData,
  MachinePhase,
  PersonId,
  RestartedData,
  RunId,
  TurnFailureCode,
  VersionData,
} from '@conexus/hub-api'
import { MessageId, machinePhaseLasts, ToolCallId } from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import type { RequestContext } from '@mastra/core/request-context'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Turn } from '../model-accounts/public.ts'
import { NOTICE_PART } from '../model-accounts/public.ts'
import type { Settled } from '../runs/public.ts'
import type { Recorder } from './record.ts'
import { saveExtras, settled } from './record.ts'
import { SAID_EVERY_MS } from './shell.ts'
import { settleThinking, startThinking, tell, tellExtra } from './tell.ts'
import { FINISHES, TurnTally, turnLine } from './turn-line.ts'
import type { Listener, TurnLog } from './turn-log.ts'
import { messagesOf, say } from './turn-log.ts'
import { cutTail, modelOf, wireEvent, wireShell, wireSuspended } from './wire.ts'

export type { Question } from './record.ts'
export type { Listener } from './turn-log.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }

/** A run Mastra woke for one of this conversation's messages, until its end. */
type Run = { turn: Turn; ended: () => void }

/** A conversation open in this process: its controller session and its turn. */
export type Live = Recorder & {
  conversationId: ConversationId
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
  /**
   * Messages Mastra accepted into the running turn (`deliver`) and has not put on the transcript yet,
   * by message id; read once its `message_start` (`role: 'signal'`) comes.
   */
  pending: Set<string>
  /**
   * The turn going on in the next run Mastra starts: a message closed its card, or Mastra keeps input
   * the ending run never read. Set before that run's end, filled with its run, taken at `agent_start`.
   */
  carry: { run: Run | undefined } | undefined
  /** Mastra is about to end the run (`beforeAgentEnd` began): a message now waits for the turn's end. */
  ending: boolean
  /** Removes messages Mastra has not read (`cancelQueuedMessages`), before a Parar aborts. */
  cancel: (signalIds: string[]) => void
  /** The run of the message in progress: ends and saves it when Mastra's run is about to end. */
  run:
    | {
        id: RunId
        traceId: string
        /** What Mastra needs of the turn to go on after an answer or a message. */
        context: RequestContext
        finish: (reason: string) => Promise<Settled | 'gone'>
        /** The run waits on the person's answer, or goes on after it; rejects when the database refuses. */
        waiting: (waiting: boolean) => Promise<void>
      }
    | undefined
  /** Why the turn ended badly, for its end to say: a save that failed, or a question that expired (card, the failures table). */
  saveFailure: TurnFailureCode | undefined
  unsubscribe: () => void
}

function newTurn(id: RunId | undefined, traceId?: string): TurnLog {
  return {
    id,
    answerId: MessageId.parse(id ?? randomUUID()),
    startedAt: new Date().toISOString(),
    steps: [],
    extras: [],
    model: null,
    after: undefined,
    said: [],
    next: 0,
    thinking: new Map(),
    shells: new Map(),
    tally: new TurnTally(),
    traceId,
    failureKept: false,
    parked: new Set(),
    extrasAt: undefined,
    ended: false,
  }
}

/** Unread messages leave Mastra's queue before a Parar or an abort ends the turn. */
export function cancelPending(live: Live): void {
  live.cancel([...live.pending])
  live.pending.clear()
}

/** The turn in progress, or a new one, which the stream opens with its `turn`. */
export function openTurn(live: Live): TurnLog {
  if (live.turn !== undefined && !live.turn.ended) return live.turn
  const turn = newTurn(live.run?.id, live.run?.traceId)
  live.turn = turn
  const parked = live.session.displayState.get().pendingSuspensions.values()
  const messages = messagesOf(turn, wireSuspended(parked))
  say(live, turn, { type: 'turn', messages, startedAt: turn.startedAt })
  return turn
}

/** A turn another copy ran, ended by a restart: said and kept as this process's last turn. */
export function tellRestarted(live: Live, runId: RunId, kept: Kept): void {
  if (live.turn !== undefined && !live.turn.ended) {
    // The Projeto's lock lets one turn run at a time, so a turn open here cannot be the restarted one's.
    logFailure(
      live.log,
      new Failure('INTERNAL_UNEXPECTED', { cause: 'a restart met an open turn' }),
    )
    return
  }
  const turn = newTurn(runId)
  live.turn = turn
  tellExtra(live, turn, { type: 'data-conexus-restarted', data: { kept } satisfies RestartedData })
  turn.ended = true
  say(live, turn, { type: 'turnEnd', reason: 'aborted' })
}

/** The machine's step, told as the part that says what the turn waits for; a replaced machine lasts. */
export function tellMachine(live: Live, phase: MachinePhase): void {
  const turn = openTurn(live)
  tellExtra(live, turn, { type: 'data-conexus-machine', data: { phase } satisfies MachineData })
  if (machinePhaseLasts(phase)) void saveExtras(live, turn)
}

function onMessageEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'message_start' && event.message.role === 'signal') {
    // Only a message the person sent into the running turn is told: a waking message is already
    // the turn's question (`turn.after`).
    if (!live.pending.delete(event.message.id)) return
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, openTurn(live), wired)
    return
  }
  if (event.type === 'message_start' && event.message.role === 'assistant') {
    const turn = openTurn(live)
    for (const [index, part] of event.message.content.parts.entries()) {
      if (part.type === 'reasoning') startThinking(turn, MessageId.parse(event.message.id), index)
    }
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, turn, wired)
    turn.model ??= modelOf(event.message)
    return
  }
  if (event.type !== 'message_update' || live.turn === undefined || live.turn.ended) return
  const turn = live.turn
  const { event: update } = event
  if (update.type === 'reasoning-delta')
    startThinking(turn, MessageId.parse(event.id), update.index)
  else settleThinking(live, turn)
  if (update.type === 'part' && update.part.type === 'reasoning') {
    startThinking(turn, MessageId.parse(event.id), update.index)
  }
  const wired = wireEvent(event)
  if (wired !== undefined) tell(live, turn, wired)
  if (update.type === 'part' && update.part.type === 'tool-invocation') {
    const { toolInvocation: call } = update.part
    if (call.state === 'output-error') turn.tally.failed(call.toolName)
  }
}

/** A run ended: its turn ends with it, or waits for the run it never learned the id of. */
export function endRun(live: Live, reason: Ending['reason'], parked?: string): void {
  if (live.carry !== undefined && live.carry.run === undefined && reason !== 'aborted') {
    // Mastra starts a run for input this one never read: the turn goes on there (`agent_start`).
    const carried = live.session.run.getRunId()
    live.carry.run = carried === null ? undefined : live.runs.get(carried)
    if (carried !== null) live.runs.delete(carried)
    return
  }
  // Mastra still names the ending run when it says so (`finishAgentRun`); a parked run is named by its suspension.
  const runId = parked ?? live.session.run.getRunId()
  const run = runId === null ? undefined : live.runs.get(runId)
  if (runId !== null) live.runs.delete(runId)
  if (runId !== null && run === undefined && live.asked.size > 0) {
    live.unclaimed = { run: runId, reason }
    return
  }
  endTurn(live, { reason, turn: run?.turn, finish: live.turn?.tally.finishReason })
  run?.ended()
}

/** The controller's events as the stream says them (`wireEvent`), and what the turn keeps of them. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  live.turn?.tally.heard(event)
  if (event.type === 'agent_start') {
    openTurn(live)
    // The run Mastra starts carries the turn of the one before it: a message closed its card, or the
    // one before ended with input it never read.
    const runId = live.session.run.getRunId()
    if (live.carry?.run !== undefined && runId !== null) live.runs.set(runId, live.carry.run)
    live.carry = undefined
    live.ending = false
  } else if (event.type === 'agent_end') {
    // A run parked on a question or a plan is not over: its turn goes on once it is answered.
    if (event.reason !== 'suspended') endRun(live, event.reason)
  } else if (event.type === 'info') {
    // The notice the model queue says live (`notify`); Mastra saves the same one with the answer, so ours is not kept.
    tellExtra(live, openTurn(live), { type: NOTICE_PART, data: { text: event.message } })
  } else if (event.type === 'shell_output' || event.type === 'command_exit') {
    onShellEvent(live, event)
  } else if (event.type === 'message_start' || event.type === 'message_update') {
    onMessageEvent(live, event)
  } else if (live.turn !== undefined && !live.turn.ended) {
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, live.turn, wired)
    if (wired?.type.startsWith('om_')) {
      const { omProgress, bufferingMessages, bufferingObservations } =
        live.session.displayState.get()
      const progress = { omProgress, bufferingMessages, bufferingObservations }
      tell(live, live.turn, { type: 'om_progress', ...progress })
    }
    if (wired?.type === 'tool_suspended') live.turn.parked.add(wired.toolCallId)
  }
}

/** A command's output, kept to its last lines: said while it runs, and once more when it exits. */
function onShellEvent(
  live: Live,
  event: Extract<AgentControllerEvent, { type: 'shell_output' | 'command_exit' }>,
): void {
  const turn = live.turn
  if (turn === undefined || turn.ended) return
  const exited = event.type === 'command_exit'
  if (!exited && Date.now() - (turn.shells.get(event.toolCallId) ?? 0) < SAID_EVERY_MS) return
  if (exited) turn.shells.delete(event.toolCallId)
  else turn.shells.set(event.toolCallId, Date.now())
  const output = live.session.displayState.get().activeTools.get(event.toolCallId)?.shellOutput
  const heard = cutTail(output ?? '', false)
  const stream = event.type === 'shell_output' ? event.stream : 'stdout'
  tell(
    live,
    turn,
    wireShell({ toolCallId: ToolCallId.parse(event.toolCallId), tail: heard, stream }),
  )
  const wired = wireEvent(event)
  if (exited && wired !== undefined) tell(live, turn, wired)
}

type Ending = {
  reason: 'complete' | 'aborted' | 'error' | 'suspended' | undefined
  turn: Turn | undefined
  /** How the model finished, when Mastra said it was not a normal finish (`TurnTally.finishReason`). */
  finish: string | undefined
  unexpected?: TurnFailureCode
}

/** Why a failed turn failed, by how the queue ended its run's turn, never the provider's text. */
function failureOf(ending: Ending): TurnFailureCode | undefined {
  if (ending.reason !== 'error') return undefined
  if (ending.unexpected !== undefined) return ending.unexpected
  if (ending.turn?.outcome === 'exhausted') return 'MODEL_NO_ACCOUNT'
  return (ending.finish === undefined ? undefined : FINISHES[ending.finish]) ?? 'MODEL_CALL_FAILED'
}

/** The turn's failure, told and kept once. */
function tellFailure(live: Live, turn: TurnLog, code: TurnFailureCode): void {
  if (turn.failureKept) return
  turn.failureKept = true
  tellExtra(live, turn, { type: 'data-conexus-failure', data: { code } satisfies FailureData })
}

function tellVersion(live: Live, turn: TurnLog, saved: VersionData): void {
  tellExtra(live, turn, { type: 'data-conexus-version', data: saved })
}

/**
 * Keeps a turn's version and failure, and waits for the thinking times, before Mastra says its run
 * ended, so the read a screen makes at the end finds them with the turn's messages, which Mastra
 * saves after the end.
 */
export async function beforeAgentEnd(live: Live, reason: Ending['reason']): Promise<void> {
  if (reason === 'suspended') return
  if (reason !== 'aborted' && live.pending.size > 0) {
    // Mastra starts a fresh run with input this run never read (`drainPendingSignals`): the turn,
    // its row and its lease go on there.
    live.carry = { run: undefined }
    return
  }
  if (live.pending.size > 0) cancelPending(live)
  live.ending = true
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
  if (outcome !== undefined && outcome !== 'gone' && live.turn !== undefined) {
    live.turn.tally.rounds = outcome.rounds
  }
  if (outcome !== undefined && outcome !== 'gone' && outcome.kind === 'failed') {
    live.saveFailure = outcome.code
  }
  const turn = live.turn
  if (turn !== undefined) settleThinking(live, turn)
  if (outcome !== undefined && outcome !== 'gone' && outcome.kind === 'saved') {
    if (turn !== undefined) tellVersion(live, turn, outcome.version)
  }
  const code =
    live.saveFailure ??
    failureOf({ reason, turn: run?.turn, finish: live.turn?.tally.finishReason })
  if (code !== undefined && turn !== undefined && (run !== undefined || live.saveFailure)) {
    tellFailure(live, turn, code)
  }
  // A write of nothing, queued last, settles once every write before it has.
  if (turn !== undefined) await saveExtras(live, turn)
  await settled(live)
}

/**
 * The end of a turn, said once: a failed one first says why, as a part, by how the queue ended
 * its run's turn (security S41). A failure not told before the end, as a run whose message did not
 * know it yet, is told and kept now; one that could not be kept is logged, and the turn still ends.
 */
export function endTurn(live: Live, ending: Ending): void {
  const turn = openTurn(live)
  turn.ended = true
  settleThinking(live, turn)
  const ended =
    ending.reason === 'error' || ending.reason === 'aborted' ? ending.reason : 'complete'
  const code = live.saveFailure ?? failureOf(ending)
  live.saveFailure = undefined
  if (code !== undefined) {
    tellFailure(live, turn, code)
    void saveExtras(live, turn)
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
