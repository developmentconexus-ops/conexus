import type { TurnFailureCode } from '@conexus/hub-api'
import type { AgentControllerEvent } from '@mastra/core/agent-controller'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Live } from './live.ts'
import { cancelPending } from './live.ts'
import { saveExtras, settled } from './record.ts'
import { settleThinking } from './tell.ts'
import { turnLine } from './turn-line.ts'
import { say } from './turn-log.ts'
import { tellFailure, tellVersion } from './turn-parts.ts'
import type { EndReason, Writing } from './turn-state.ts'
import { closing, deciding, ended, failing, steered } from './turn-state.ts'

type AgentEnd = Extract<AgentControllerEvent, { type: 'agent_end' }>['reason']

/**
 * Keeps a turn's version and failure, and waits for the thinking times, before Mastra says its run
 * ended, so the read a screen makes at the end finds them with the turn's messages, which Mastra
 * saves after the end.
 */
export async function beforeAgentEnd(live: Live, reason: AgentEnd): Promise<void> {
  if (reason === 'suspended') return
  const s = live.state
  // A turn a message carries goes on in the run that message starts, not in the one ending now.
  if (s.kind !== 'running' && s.kind !== 'parked') return
  if (reason !== 'aborted' && live.pending.size > 0) {
    // Mastra starts a fresh run with input this run never read (`drainPendingSignals`): the turn,
    // its row and its lease go on there.
    live.state = steered(s)
    return
  }
  const ending = reason === 'error' || reason === 'aborted' ? reason : 'complete'
  await closeTurn(live, ending, reason ?? 'unknown')
}

/**
 * The turn closes: unread messages leave Mastra's queue, its run row is finished, and its failure
 * is decided once (`deciding`) and kept with its version before the end is said.
 */
async function closeTurn(live: Live, reason: EndReason, finishing: string): Promise<void> {
  if (live.pending.size > 0) cancelPending(live)
  const s = closing(live.state, reason)
  if (s.kind !== 'closing') return
  live.state = s
  // A save that throws is this turn's failure, said and logged here: Mastra would print the listener's
  // error raw, and the turn would end without saying why.
  const outcome = await s.writing.finish(finishing).catch((cause: unknown) => {
    logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
    return 'threw' as const
  })
  const turn = s.log
  if (outcome !== 'threw' && outcome !== 'gone') turn.tally.rounds = outcome.rounds
  settleThinking(live, turn)
  if (outcome !== 'threw' && outcome !== 'gone' && outcome.kind === 'saved') {
    tellVersion(live, turn, outcome.version)
  }
  live.state = deciding(live.state, outcome)
  if (live.state.kind === 'ending' && live.state.failure !== undefined) {
    tellFailure(live, turn, live.state.failure)
  }
  // A write of nothing, queued last, settles once every write before it has.
  await saveExtras(live, turn)
  await settled(live)
}

/**
 * The end of a turn, said once: a failed one first said why, as a part, where its failure was
 * decided (security S41); a turn not decided yet, or already over, says nothing.
 */
export function endTurn(live: Live): void {
  const s = live.state
  if (s.kind !== 'ending') return
  live.state = ended(s)
  const turn = s.log
  settleThinking(live, turn)
  const { conversationId, owner } = live
  const line = turnLine({
    ...{ runId: turn.id, traceId: turn.traceId, startedAt: turn.startedAt, tally: turn.tally },
    ...{ end: s.reason, errorCode: s.failure },
  })
  const fields = { companyId: owner.companyId, conversationId, reason: s.reason, ...line }
  live.log.info(fields, 'CONVERSATION_TURN_ENDED')
  say(live, turn, { type: 'turnEnd', reason: s.reason })
  s.writing.ended()
}

/**
 * Mastra ends no run of the turn here (a parked run aborted, a message it could not route): the
 * turn of `writing` ends as an ended run's does, once; a turn already closing, or another, stays.
 */
export async function endWithout(
  live: Live,
  writing: Writing,
  reason: EndReason,
  failure?: TurnFailureCode,
): Promise<void> {
  const s = live.state
  if (s.kind !== 'running' && s.kind !== 'parked' && s.kind !== 'steering') return
  if (s.writing !== writing) return
  if (failure !== undefined) live.state = failing(s, failure)
  await closeTurn(live, reason, reason)
  endTurn(live)
}
