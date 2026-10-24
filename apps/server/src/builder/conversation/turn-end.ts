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
import type { EndReason } from './turn-state.ts'
import { closed, ended, failing } from './turn-state.ts'

type AgentEnd = Extract<AgentControllerEvent, { type: 'agent_end' }>['reason']

/** The run ending is one a message's `steer` denied (`closing`), not the turn's. */
function denied(live: Live): boolean {
  const runId = live.session.getCurrentRunId()
  return runId !== null && live.closing.has(runId)
}

/**
 * Mastra's run ends, for any reason, a question or a plan included (`suspended`): the run is
 * finished, its version and failure kept, before Mastra says `agent_end`, so the read a screen makes
 * at the end finds them with the turn's messages. A run Mastra goes on from, with input it never
 * read (`drainPendingSignals`), keeps its turn and its run.
 */
export async function beforeAgentEnd(live: Live, reason: AgentEnd): Promise<void> {
  const s = live.state
  if (s.kind !== 'running' || s.end !== undefined || denied(live)) return
  if (reason !== 'aborted' && reason !== 'suspended' && live.pending.size > 0) return
  const ending = reason === 'error' || reason === 'aborted' ? reason : 'complete'
  await closeTurn(live, ending, reason ?? 'unknown')
}

/**
 * The turn closes: unread messages leave Mastra's queue, its run is finished (the version saved,
 * the machine let go), and its failure is decided once and kept with its version.
 */
async function closeTurn(live: Live, reason: EndReason, finishing: string): Promise<void> {
  const s = live.state
  if (s.kind !== 'running' || s.end !== undefined) return
  if (live.pending.size > 0) cancelPending(live)
  // A save that throws is this turn's failure, said and logged here: Mastra would print the
  // listener's error raw, and the turn would end without saying why.
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
  live.state = closed(live.state, reason, outcome)
  if (live.state.kind === 'running' && live.state.failure !== undefined) {
    tellFailure(live, turn, live.state.failure)
  }
  // A write of nothing, queued last, settles once every write before it has.
  await saveExtras(live, turn)
  await settled(live)
}

/** `agent_end`: the end of the closed turn, said once, with its log line (security S41). */
export function endTurn(live: Live): void {
  const s = live.state
  if (s.kind !== 'running' || s.end === undefined || denied(live)) return
  live.state = ended(s)
  const turn = s.log
  settleThinking(live, turn)
  const { conversationId, owner } = live
  const line = turnLine({
    ...{ runId: turn.id, traceId: turn.traceId, startedAt: turn.startedAt, tally: turn.tally },
    ...{ end: s.end, errorCode: s.failure },
  })
  const fields = { companyId: owner.companyId, conversationId, reason: s.end, ...line }
  live.log.info(fields, 'CONVERSATION_TURN_ENDED')
  say(live, turn, { type: 'turnEnd', reason: s.end })
  s.writing.ended()
}

/**
 * Mastra started no run for the turn (it refused the message or the answer, or a Parar came first):
 * it ends here, once, as an ended run's does.
 */
export async function endUnstarted(
  live: Live,
  reason: EndReason,
  failure?: TurnFailureCode,
): Promise<void> {
  if (failure !== undefined) live.state = failing(live.state, failure)
  await closeTurn(live, reason, reason)
  endTurn(live)
}
