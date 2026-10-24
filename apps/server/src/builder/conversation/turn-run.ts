import { randomUUID } from 'node:crypto'
import type { RunId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { Turn, turnContext } from '../model-accounts/public.ts'
import type { Run, Runs } from '../runs/public.ts'
import { detach, expire, openCards } from './cards.ts'
import { deliver } from './deliver.ts'
import type { Live, Question } from './live.ts'
import { questionId, settled } from './record.ts'
import { endTurn } from './turn-end.ts'
import { openTurn, tellMachine } from './turn-parts.ts'

/** The run of the turn on the conversation: what Mastra needs of it, and how it ends and waits. */
function bindRun(
  live: Live,
  runs: Runs,
  turn: Turn,
  run: { runId: RunId; traceId: string },
): RequestContext {
  const writing = run.runId
  const context = runs.contextOf(turnContext(turn), writing)
  live.run = {
    id: writing,
    traceId: run.traceId,
    context,
    finish: (reason) => runs.finish({ runId: writing, reason }),
    waiting: (waiting) => runs.waiting(writing, waiting, () => expire(live)),
  }
  runs.onPhase(writing, (phase) => tellMachine(live, phase))
  return context
}

/** The end of a turn's wait: its run is settled, if nothing settled it, and its thread written. */
async function overTurn(live: Live, runs: Runs, turn: Turn, writing: RunId): Promise<void> {
  live.asked.delete(turn)
  turn.end()
  live.run = undefined
  await runs.finish({ runId: writing, reason: 'error' })
  if (live.unclaimed !== undefined && live.asked.size === 0) {
    const { reason } = live.unclaimed
    live.unclaimed = undefined
    endTurn(live, { reason, turn: undefined, finish: live.turn?.tally.finishReason })
  }
  // The turn is over once what it keeps on the thread is written: the drain waits for that.
  await settled(live)
}

/**
 * Another copy took the run while its card is open: Mastra keeps the card for that copy
 * (`detach`), and the turn's wait here ends, its run `gone`.
 */
function leave(live: Live): void {
  detach(live)
  for (const run of live.runs.values()) run.ended()
  live.runs.clear()
}

/**
 * Mastra decides where the message goes (`requireDelivery`): it wakes a run, which carries this
 * message's turn to the queue until that run's `agent_end`, or it joins the run in progress,
 * whose turn stays (criterion 12). `sendSignal` is `sendMessage`'s own call, which keeps that
 * decision to itself; the turn of each run is the one of the message that woke it, by Mastra's
 * run id, never the latest message's. A message Mastra could not route started no run: its
 * failure is the turn's end when no other run is in progress. A turn Mastra ran keeps its
 * failure after the message that opened it, the one it saves the turn after.
 */
export async function answerTurn(
  live: Live,
  deps: { runs: Runs; log: FailureLog },
  question: Question,
  turn: Turn,
  run: { runId: RunId; traceId: string },
): Promise<void> {
  const { runs, log } = deps
  const writing = run.runId
  const fields = { companyId: live.owner.companyId, conversationId: live.conversationId }
  log.info(fields, 'CONVERSATION_TURN_STARTED')
  const id = questionId(live.conversationId, question.key)
  const requestContext = bindRun(live, runs, turn, run)
  const opened = openTurn(live)
  runs.attach(writing, {
    abort: () => live.session.abort(),
    lost: () => (openCards(live).length > 0 ? leave(live) : live.session.abort()),
  })
  try {
    // Mastra takes a trace id without dashes; the request's is the turn's (card, U10).
    const tracingOptions = { traceId: run.traceId.replaceAll('-', '') }
    const options = { requestContext, requireDelivery: true, tracingOptions } as const
    const accepted = await deliver(live, { question, id }, options)
    opened.after ??= id
    const runId = accepted.action === 'wake' ? accepted.runId : undefined
    if (runId !== undefined && live.unclaimed?.run === runId) {
      const { reason } = live.unclaimed
      live.unclaimed = undefined
      endTurn(live, { reason, turn, finish: live.turn?.tally.finishReason })
    } else if (runId !== undefined) {
      await new Promise<void>((ended) => live.runs.set(runId, { turn, ended }))
    }
  } catch (cause) {
    logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause }))
    if (live.runs.size === 0 && !live.session.stream.isActive()) {
      endTurn(live, {
        reason: 'error',
        turn,
        finish: undefined,
        unexpected: 'INTERNAL_UNEXPECTED',
      })
    }
  } finally {
    await overTurn(live, runs, turn, writing)
  }
}

/**
 * The turn of a run another copy left on its cards (`adoptCards`), driven here from now on: open
 * streams get it with the cards, and it waits for the end of the Mastra runs that parked them, as
 * a message's turn waits for its run (founder 2026-10-24, "4. B").
 */
export async function adoptTurn(
  live: Live,
  runs: Runs,
  run: Run,
  parkedRuns: string[],
): Promise<void> {
  const turn = new Turn({ companyId: run.companyId, personId: run.personId })
  bindRun(live, runs, turn, { runId: run.id, traceId: randomUUID() })
  runs.drive(run, {
    abort: () => live.session.abort(),
    lost: () => leave(live),
    expire: () => expire(live),
  })
  const opened = openTurn(live)
  for (const card of openCards(live)) opened.parked.add(card.toolCallId)
  try {
    await new Promise<void>((ended) => {
      for (const id of parkedRuns) live.runs.set(id, { turn, ended })
    })
  } finally {
    await overTurn(live, runs, turn, run.id)
  }
}
