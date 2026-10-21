import type { RequestContext } from '@mastra/core/request-context'
import type { Live, Question } from './live.ts'

/** What the model is told when the server restarted in the middle of its turn (card, "A continuação"). */
const CONTINUATION = 'O servidor reiniciou no meio do turno. Veja `git status` e termine o pedido.'

function userMessage(id: string, contents: string) {
  return { type: 'user', id, contents } as const
}

type Options = { requestContext: RequestContext; requireDelivery: true; tracingOptions: object }

/**
 * Puts a turn's message on the thread. A question goes in as a message that wakes the thread. A
 * turn resumed after a restart whose question was never saved has seen nothing of itself, so its
 * question is sent again as it was; one whose question is saved has the steps it took missing
 * (`savePerStep: false`), and is woken by the reminder of the restart, which a thread wakes for
 * only when told to.
 */
export async function deliver(
  live: Live,
  input: { question: Question | undefined; id: string },
  options: Options,
) {
  const { question, id } = input
  if (question !== undefined) {
    return live.session.sendSignal(userMessage(id, question.content), options).accepted
  }
  const reminder = { type: 'system-reminder', id: `${id}-resumed`, contents: CONTINUATION } as const
  return live.session.sendSignal(reminder, { ...options, ifIdle: { behavior: 'wake' } }).accepted
}
