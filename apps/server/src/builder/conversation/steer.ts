import type { ConversationEvent, MessageId } from '@conexus/hub-api'
import { isSessionStartupCancelledError } from '@mastra/core/agent-controller'
import { releaseCards, takeCards } from './cards.ts'
import { deliver } from './deliver.ts'
import type { Listener, Live, Question } from './live.ts'
import { saveQuestion } from './record.ts'
import { tell } from './tell.ts'
import { endWithout } from './turn-end.ts'
import { isOpen, logOf, steered, writingOf } from './turn-state.ts'

type Input = { question: Question; id: MessageId }

/** The person's message as the stream says it where it enters the turn. */
function personStart(id: MessageId, question: Question): ConversationEvent {
  const parts = [{ type: 'text' as const, text: question.content }]
  const message = { id, role: 'person' as const, parts, suspended: {}, model: null }
  return { type: 'message_start', message: { ...message, createdAt: question.at } }
}

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

/** A message sent while a card is open: closes it and wakes the next run of the same turn (S1). */
export async function steerCards(live: Live, { question, id }: Input): Promise<boolean> {
  const taken = await takeCards(live)
  if (taken.length === 0) return false
  try {
    await saveQuestion(live, question) // criterion 30: saved before the run that answers it
  } catch (error) {
    releaseCards(live, taken)
    throw error
  }
  releaseCards(live, taken)
  const writing = writingOf(live.state)
  live.state = steered(live.state) // `agent_start` of the run the message wakes takes it
  live.session.abort()
  const options = { requestContext: writing?.context, requireDelivery: true } as const
  const accepted = await deliver(live, { question, id }, options).catch(async (error: unknown) => {
    // The message, kept, started no run: the turn ends here, as stopped when a Parar came first
    // (Mastra cancels the start, `SessionStartupCancelledError`).
    const stopped = isSessionStartupCancelledError(error)
    if (writing !== undefined) {
      await endWithout(
        live,
        writing,
        stopped ? 'aborted' : 'error',
        stopped ? undefined : 'INTERNAL_UNEXPECTED',
      )
    }
    if (!stopped) throw error
    return undefined
  })
  if (accepted === undefined) return true
  // The woken run is the turn's next one; the screen sees the message now, where it goes.
  const turn = logOf(live.state)
  if (turn !== undefined) tell(live, turn, personStart(id, question))
  return accepted.action === 'wake' || accepted.action === 'deliver'
}

/** Until the turn in progress says `turnEnd`, or now when none is open. */
export function turnOver(live: Live): Promise<void> {
  if (!isOpen(live.state)) return Promise.resolve()
  return new Promise((done) => {
    const listener: Listener = ({ event }) => {
      if (event.type !== 'turnEnd') return
      live.listeners.delete(listener)
      done()
    }
    live.listeners.add(listener)
  })
}

/** Until the next run of the turn starts (`agent_start`), or the turn ends, whichever comes first. */
export function nextRunOrEnd(live: Live): Promise<void> {
  return new Promise((done) => {
    const ended: Listener = ({ event }) => {
      if (event.type === 'turnEnd') finish()
    }
    const unsubscribe = live.session.subscribe((event) => {
      if (event.type === 'agent_start') finish()
    })
    function finish() {
      unsubscribe()
      live.listeners.delete(ended)
      done()
    }
    live.listeners.add(ended)
    if (!isOpen(live.state)) finish()
  })
}
