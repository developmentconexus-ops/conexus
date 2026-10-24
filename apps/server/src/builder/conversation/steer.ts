import type { MessageId } from '@conexus/hub-api'
import { releaseCards, takeCards } from './cards.ts'
import { deliver } from './deliver.ts'
import type { Live, Question } from './live.ts'
import { writingOf } from './turn-state.ts'

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
 * A message sent while a card is open closes it (S1): Mastra's abort denies the parked calls, and
 * the message is the next turn's.
 */
export async function closeCards(live: Live): Promise<void> {
  const taken = await takeCards(live)
  if (taken.length === 0) return
  live.session.abort()
  releaseCards(live, taken)
}
