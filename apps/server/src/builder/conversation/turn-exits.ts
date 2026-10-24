import type { TurnFailureCode } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Live } from './live.ts'
import { endWithout } from './turn-end.ts'
import type { EndReason, Writing } from './turn-state.ts'

/** A way out of Mastra's run besides `agent_end`: the turn of `writing` ends there, once, unless the watch stopped. */
function end(live: Live, writing: Writing, reason: EndReason, failure?: TurnFailureCode): void {
  if (writing.exits.signal.aborted) return
  endWithout(live, writing, reason, failure).catch((cause: unknown) =>
    logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause })),
  )
}

/**
 * An abort requested after `gen` ends the turn. A message steering the turn aborts the run on
 * purpose, so only an abort after it counts. A run Mastra runs here still says its end once torn
 * down (`run.reset()` after `agent_end`); one whose events never came has no end to wait for.
 */
async function abortExit(live: Live, writing: Writing, gen: number): Promise<void> {
  const { run } = live.session
  const { signal } = writing.exits
  await run.waitForAbortRequest(signal, { after: gen })
  if (signal.aborted) return
  if (live.state.kind === 'steering') return abortExit(live, writing, run.getAbortGeneration())
  if (run.getRunId() !== null) await run.waitForTeardown(signal)
  end(live, writing, 'aborted')
}

/**
 * The stream torn down ends the turn. A turn parked or steered can be bound again by Mastra (a
 * resume, or the steered message's fresh subscription), so there the watch goes on.
 */
async function teardownExit(live: Live, writing: Writing): Promise<void> {
  const { signal } = writing.exits
  await live.session.stream.waitForTeardown(signal)
  if (signal.aborted) return
  if (live.state.kind === 'parked' || live.state.kind === 'steering') {
    return teardownExit(live, writing)
  }
  end(live, writing, 'aborted')
}

/**
 * Every way Mastra's run of the turn can end besides `agent_end`, watched as Mastra's own wait for
 * an accepted run watches them (`waitForAcceptedRunCompletion`, private, so mirrored here on its
 * public waiters, code C75): an abort, the stream torn down, or its run loop failing. Each ends the
 * turn through the same close as `agent_end`, so a late `agent_end` finds it over; the turn's end,
 * its session's close or a detach stops the watch (`writing.exits`). Armed before the message is
 * sent; the function it returns arms the rest once Mastra accepted it.
 */
export function watchExits(live: Live, writing: Writing): () => void {
  const { session } = live
  const { signal } = writing.exits
  const threadId = session.thread.getId()
  let tornDown = false
  void session.stream.waitForTeardown(signal).then(() => {
    tornDown = true
  })
  void abortExit(live, writing, session.run.getAbortGeneration())
  return function accepted() {
    if (signal.aborted) return
    // Sending may bind the stream again on its own: a teardown then ends the turn only when the
    // thread was not bound again.
    const threadNow = session.thread.getId()
    const away = !session.stream.isOpen() || (threadId !== null && threadNow !== threadId)
    if (tornDown && away) return end(live, writing, 'aborted')
    void teardownExit(live, writing)
    session.stream.waitForConsumerFailure(signal).catch((cause: unknown) => {
      logFailure(live.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
      end(live, writing, 'error', 'INTERNAL_UNEXPECTED')
    })
  }
}
