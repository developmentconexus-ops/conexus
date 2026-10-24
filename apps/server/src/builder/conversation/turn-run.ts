import { randomUUID } from 'node:crypto'
import type { RunId } from '@conexus/hub-api'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import type { Run, Runs } from '../runs/public.ts'
import { detach, expire, openCards } from './cards.ts'
import { deliver } from './deliver.ts'
import type { Live, Question } from './live.ts'
import { questionId, settled } from './record.ts'
import { endWithout } from './turn-end.ts'
import { beginTurn, tellMachine } from './turn-parts.ts'
import type { Writing } from './turn-state.ts'
import { ended, suspended, writingOf } from './turn-state.ts'

/**
 * The run of the turn on the conversation: what Mastra needs of it, how it ends and waits, and the
 * wait of its message, which the turn's end, or its session's close, resolves.
 */
function bindRun(
  live: Live,
  runs: Runs,
  turn: Turn,
  run: { runId: RunId; traceId: string },
): { writing: Writing; over: Promise<void> } {
  const id = run.runId
  const { promise: over, resolve: ended } = Promise.withResolvers<void>()
  const writing: Writing = {
    ...{ id, traceId: run.traceId, context: runs.contextOf(turnContext(turn), id), turn },
    finish: (reason) => runs.finish({ runId: id, reason }),
    waiting: (waiting) => runs.waiting(id, waiting, () => expire(live)),
    ended,
  }
  runs.onPhase(id, (phase) => tellMachine(live, phase))
  return { writing, over }
}

/**
 * The end of a turn's wait: a turn still open, as one whose session closed or another copy took,
 * is over here with nothing said; its run is settled, if nothing settled it, and its thread written.
 */
async function overTurn(live: Live, runs: Runs, writing: Writing): Promise<void> {
  writing.turn.end()
  if (writingOf(live.state) === writing) live.state = ended(live.state)
  await runs.finish({ runId: writing.id, reason: 'error' })
  // The turn is over once what it keeps on the thread is written: the drain waits for that.
  await settled(live)
}

/**
 * Another copy took the run while its card is open: Mastra keeps the card for that copy
 * (`detach`), and the turn's wait here ends, its run `gone`.
 */
function leave(live: Live): void {
  detach(live)
  writingOf(live.state)?.ended()
}

/**
 * Mastra decides where the message goes (`requireDelivery`): it wakes a run, or it joins the run
 * in progress (criterion 12); either way the turn's state is the one Mastra's events move, and the
 * message waits for its end. `sendSignal` is `sendMessage`'s own call, which keeps that wait to
 * itself. A message Mastra could not route started no run: its failure is the turn's end when no
 * run of it is in progress. A turn Mastra ran keeps its failure after the message that opened it,
 * the one it saves the turn after.
 */
export async function answerTurn(
  live: Live,
  deps: { runs: Runs; log: FailureLog },
  question: Question,
  turn: Turn,
  run: { runId: RunId; traceId: string },
): Promise<void> {
  const { runs, log } = deps
  const fields = { companyId: live.owner.companyId, conversationId: live.conversationId }
  log.info(fields, 'CONVERSATION_TURN_STARTED')
  const id = questionId(live.conversationId, question.key)
  const { writing, over } = bindRun(live, runs, turn, run)
  const opened = beginTurn(live, writing)
  runs.attach(writing.id, {
    abort: () => live.session.abort(),
    lost: () => (openCards(live).length > 0 ? leave(live) : live.session.abort()),
  })
  try {
    // Mastra takes a trace id without dashes; the request's is the turn's (card, U10).
    const tracingOptions = { traceId: run.traceId.replaceAll('-', '') }
    const options = {
      requestContext: writing.context,
      requireDelivery: true,
      tracingOptions,
    } as const
    const accepted = await deliver(live, { question, id }, options)
    opened.after ??= id
    if ('runId' in accepted) await over
    else await endWithout(live, writing, 'error', 'INTERNAL_UNEXPECTED')
  } catch (cause) {
    logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause }))
    const s = live.state
    if (s.kind === 'running' && s.mastraRun === undefined && !live.session.stream.isActive()) {
      await endWithout(live, writing, 'error', 'INTERNAL_UNEXPECTED')
    }
  } finally {
    await overTurn(live, runs, writing)
  }
}

/**
 * The turn of a run another copy left on its cards (`adoptCards`), driven here from now on: open
 * streams get it with the cards, parked from its start, and it waits for its end, as a message's
 * turn does (founder 2026-10-24, "4. B").
 */
export async function adoptTurn(live: Live, runs: Runs, run: Run): Promise<void> {
  const turn = new Turn({ companyId: run.companyId, personId: run.personId })
  const { writing, over } = bindRun(live, runs, turn, { runId: run.id, traceId: randomUUID() })
  beginTurn(live, writing)
  for (const parked of live.session.displayState.get().pendingSuspensions.values()) {
    live.state = suspended(live.state, parked.toolCallId, parked.runId)
  }
  runs.drive(run, {
    abort: () => live.session.abort(),
    lost: () => leave(live),
    expire: () => expire(live),
  })
  try {
    await over
  } finally {
    await overTurn(live, runs, writing)
  }
}
