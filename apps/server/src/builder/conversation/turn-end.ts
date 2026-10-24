import type { TurnFailureCode } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Ending, Live } from './live.ts'
import { cancelPending } from './live.ts'
import { saveExtras, settled } from './record.ts'
import { settleThinking } from './tell.ts'
import { FINISHES, turnLine } from './turn-line.ts'
import { say } from './turn-log.ts'
import { openTurn, tellFailure, tellVersion } from './turn-parts.ts'

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

/** Why a failed turn failed, by how the queue ended its run's turn, never the provider's text. */
function failureOf(ending: Ending): TurnFailureCode | undefined {
  if (ending.reason !== 'error') return undefined
  if (ending.unexpected !== undefined) return ending.unexpected
  if (ending.turn?.outcome === 'exhausted') return 'MODEL_NO_ACCOUNT'
  return (ending.finish === undefined ? undefined : FINISHES[ending.finish]) ?? 'MODEL_CALL_FAILED'
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
