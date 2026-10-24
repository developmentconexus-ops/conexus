import type { MessageId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { releaseCards, takeCards } from './cards.ts'
import { deliver } from './deliver.ts'
import type { Live, Question } from './live.ts'
import { isOpen, writingOf } from './turn-state.ts'

type Input = { question: Question; id: MessageId }

/** The message, delivered into the running turn: 'delivered', or 'idle' when no run took it. */
export async function deliverInto(
  live: Live,
  { question, id }: Input,
): Promise<'delivered' | 'idle'> {
  // Added before the call: Mastra may drain the message before `accepted` resolves.
  live.pending.add(id)
  try {
    const accepted = await deliver(
      live,
      { question, id },
      {
        requestContext: writingOf(live.state)?.context,
        requireDelivery: true,
        ifIdle: { behavior: 'discard' },
      },
    )
    if (accepted.action === 'deliver') return 'delivered'
  } catch (error) {
    live.pending.delete(id)
    throw error
  }
  live.pending.delete(id)
  return 'idle'
}

/**
 * A message sent while a card is open is Mastra's `steer`, its route's call (S1): the abort denies
 * the parked calls, and the message waits for the run that denial resumes, then opens the next
 * turn's run. The denied run's end is not that turn's (`closing`). Whether the turn's run started.
 */
export async function steerCards(
  live: Live,
  message: { content: string; requestContext: RequestContext },
): Promise<boolean> {
  const taken = await takeCards(live)
  for (const parked of live.session.displayState.get().pendingSuspensions.values()) {
    if (parked.runId !== undefined) live.closing.add(parked.runId)
  }
  try {
    await live.session.steer(message)
    // Accepted, the turn's run is the session's; a message Mastra did not send leaves none.
    const runId = live.session.getCurrentRunId()
    return (runId !== null && !live.closing.has(runId)) || !isOpen(live.state)
  } finally {
    live.closing.clear()
    releaseCards(live, taken)
  }
}
