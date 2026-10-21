import type { RequestContext } from '@mastra/core/request-context'
import type { Live, Question } from './live.ts'

function userMessage(id: string, contents: string) {
  return { type: 'user', id, contents } as const
}

type Options = { requestContext: RequestContext; requireDelivery: true; tracingOptions: object }

/** Puts a turn's question on the thread, as a message that wakes it. */
export async function deliver(
  live: Live,
  input: { question: Question; id: string },
  options: Options,
) {
  const { question, id } = input
  return live.session.sendSignal(userMessage(id, question.content), options).accepted
}
