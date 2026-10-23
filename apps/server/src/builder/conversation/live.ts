import { randomUUID } from 'node:crypto'
import type {
  CompanyId,
  ConversationEvent,
  ConversationId,
  MastraPart,
  PersonId,
  RunId,
  TurnFailureCode,
} from '@conexus/hub-api'
import { applyUpdate, MessageId, THOUGHT_PART, ToolCallId } from '@conexus/hub-api'
import type { AgentControllerEvent, Session } from '@mastra/core/agent-controller'
import type { RequestContext } from '@mastra/core/request-context'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Phase as MachinePhase } from '../machine/public.ts'
import type { Turn } from '../model-accounts/public.ts'
import { NOTICE_PART } from '../model-accounts/public.ts'
import type { Outcome } from '../runs/public.ts'
import type { Recorder } from './record.ts'
import { saveExtras, settled } from './record.ts'
import { ShellTail } from './shell.ts'
import { TurnTally, turnLine } from './turn-line.ts'
import type { Listener, TurnLog } from './turn-log.ts'
import { answerOf, say } from './turn-log.ts'
import { modelOf, wireEvent, wireShell } from './wire.ts'

export type { Question } from './record.ts'
export type { Listener } from './turn-log.ts'

export type Owner = { companyId: CompanyId; personId: PersonId }

/** The version a saved turn reached, with its file counts. */
type SavedVersion = Extract<Outcome, { kind: 'saved' }>['version']

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
  /** The run a message steers, until the run it starts takes its place (card, criterion 18). */
  steering: { run: Run | undefined } | undefined
  /** The run of the message in progress: ends and saves it when Mastra's run is about to end. */
  run:
    | {
        id: RunId
        traceId: string
        /** What Mastra needs of the turn to go on after an answer or a message. */
        context: RequestContext
        finish: (reason: string) => Promise<Outcome | 'gone'>
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
    suspended: new Map(),
    extrasAt: undefined,
    ended: false,
  }
}

/** The turn in progress, or a new one, which the stream opens with its `turn`. */
export function openTurn(live: Live): TurnLog {
  if (live.turn !== undefined && !live.turn.ended) return live.turn
  const turn = newTurn(live.run?.id, live.run?.traceId)
  live.turn = turn
  say(live, turn, { type: 'turn', message: answerOf(turn), startedAt: turn.startedAt })
  return turn
}

/** An event told as the stream says it, folded into the turn's answer as the screen folds it. */
function tell(live: Live, turn: TurnLog, event: ConversationEvent): void {
  if (event.type === 'message_start') {
    turn.steps.push({ id: event.message.id, parts: event.message.parts })
    turn.model = event.message.model ?? turn.model
  } else if (event.type === 'message_update') {
    const step = turn.steps.find((each) => each.id === event.id)
    if (step !== undefined) step.parts = applyUpdate(step.parts, event.event)
  }
  say(live, turn, event)
}

/** What names a part of ours among the others, so a later one replaces it; none for the rest. */
function extraKey(part: MastraPart): string | undefined {
  if (part.type === 'data-conexus-machine') {
    const { data } = part
    const lasting =
      typeof data === 'object' && data !== null && 'phase' in data && data.phase === 'replaced'
    return lasting ? undefined : 'machine'
  }
  if (part.type === 'data-conexus-version') return 'version'
  if (part.type === THOUGHT_PART) {
    const { data } = part
    return `thought:${typeof data === 'object' && data !== null && 'id' in data ? String(data.id) : ''}`
  }
  return undefined
}

/** A part of ours, told as a part of the message the turn names: it takes the place of the one it replaces. */
function tellExtra(live: Live, turn: TurnLog, part: MastraPart): void {
  const key = extraKey(part)
  const at = key === undefined ? -1 : turn.extras.findIndex((each) => extraKey(each) === key)
  const index = at === -1 ? turn.extras.length : at
  turn.extras = applyUpdate(turn.extras, { type: 'part', index, part })
  say(live, turn, {
    type: 'message_update',
    id: turn.answerId,
    event: { type: 'part', index, part },
  })
}

/** The machine's step, told as the part that says what the turn waits for; a replaced machine lasts. */
export function tellMachine(live: Live, phase: MachinePhase): void {
  const turn = openTurn(live)
  tellExtra(live, turn, { type: 'data-conexus-machine', data: { phase } })
  if (phase === 'replaced') void saveExtras(live, turn)
}

/** The thinking in progress ends with the first part after it: how long it took, by our clock. */
function settleThinking(live: Live, turn: TurnLog): void {
  for (const [id, since] of turn.thinking) {
    const seconds = Math.ceil((Date.now() - since) / 1000)
    tellExtra(live, turn, { type: THOUGHT_PART, data: { id, seconds } })
  }
  turn.thinking.clear()
}

/** A reasoning begins at its first delta or part; the key is the one a read gives it: its message and place. */
function startThinking(turn: TurnLog, messageId: MessageId, index: number): void {
  const key = `${messageId}.${index}`
  if (!turn.thinking.has(key)) turn.thinking.set(key, Date.now())
}

function onMessageEvent(live: Live, event: AgentControllerEvent): void {
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

/** The controller's events as the stream says them (`wireEvent`), and what the turn keeps of them. */
export function onEvent(live: Live, event: AgentControllerEvent): void {
  if (event.type === 'agent_start') {
    openTurn(live)
    // The run a message started carries the turn of the one it steered.
    const runId = live.session.run.getRunId()
    if (live.steering?.run !== undefined && runId !== null) live.runs.set(runId, live.steering.run)
    live.steering = undefined
  } else if (event.type === 'agent_end') {
    // A run parked on a question or a plan is not over: its turn goes on once it is answered.
    if (event.reason !== 'suspended') endRun(live, event.reason)
  } else if (event.type === 'info') {
    // The notice the model queue says live (`notify`); Mastra saves the same one with the answer, so ours is not kept.
    tellExtra(live, openTurn(live), { type: NOTICE_PART, data: { text: event.message } })
  } else if (event.type === 'usage_update') {
    live.turn?.tally.step(event.usage.totalTokens)
  } else if (event.type === 'shell_output' || event.type === 'command_exit') {
    onShellEvent(live, event)
  } else if (event.type === 'message_start' || event.type === 'message_update') {
    onMessageEvent(live, event)
  } else if (live.turn !== undefined && !live.turn.ended) {
    const wired = wireEvent(event)
    if (wired !== undefined) tell(live, live.turn, wired)
    if (wired?.type === 'tool_suspended') {
      const { toolCallId, suspendPayload, cuts } = wired
      live.turn.suspended.set(
        toolCallId,
        cuts === undefined ? { suspendPayload } : { suspendPayload, cuts },
      )
    }
  }
}

/** A command's output, kept to its last lines: said while it runs, and once more when it exits. */
function onShellEvent(
  live: Live,
  event: Extract<AgentControllerEvent, { type: 'shell_output' | 'command_exit' }>,
): void {
  const turn = live.turn
  if (turn === undefined || turn.ended) return
  const tail = turn.shells.get(event.toolCallId) ?? new ShellTail()
  turn.shells.set(event.toolCallId, tail)
  if (event.type === 'shell_output') tail.add(event.output)
  const exited = event.type === 'command_exit'
  if (exited) turn.shells.delete(event.toolCallId)
  const heard = exited ? tail.tail() : tail.running()
  if (heard === undefined) return
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
  unexpected?: TurnFailureCode
}

/** Why a failed turn failed, by how the queue ended its run's turn, never the provider's text. */
function failureOf(ending: Ending): TurnFailureCode | undefined {
  if (ending.reason !== 'error') return undefined
  if (ending.unexpected !== undefined) return ending.unexpected
  return ending.turn?.outcome === 'exhausted' ? 'MODEL_NO_ACCOUNT' : 'MODEL_CALL_FAILED'
}

/** The turn's failure, told and kept once. */
function tellFailure(live: Live, turn: TurnLog, code: TurnFailureCode): void {
  if (turn.failureKept) return
  turn.failureKept = true
  tellExtra(live, turn, { type: 'data-conexus-failure', data: { code } })
}

function tellVersion(live: Live, turn: TurnLog, saved: SavedVersion): void {
  tellExtra(live, turn, { type: 'data-conexus-version', data: saved })
}

/**
 * Keeps a turn's version and failure, and waits for the thinking times, before Mastra says its run
 * ended, so the read a screen makes at the end finds them with the turn's messages, which Mastra
 * saves after the end.
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
  const turn = live.turn
  if (turn !== undefined) settleThinking(live, turn)
  if (outcome !== undefined && outcome !== 'gone' && outcome.kind === 'saved') {
    if (turn !== undefined) tellVersion(live, turn, outcome.version)
  }
  const code = live.saveFailure ?? failureOf({ reason, turn: run?.turn })
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
