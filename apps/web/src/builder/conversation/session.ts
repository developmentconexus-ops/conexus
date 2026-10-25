import type { Answer, ConversationId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_ROUTES } from '@conexus/hub-api'
import type { PlanResume } from '@mastra/client-js'
import { MastraClient, MastraClientError } from '@mastra/client-js'
import { failureOfProblem, HubFailure, hubClientFetch } from '../../platform/hub.ts'

/**
 * The conversation's session on Mastra's own routes, behind the Hub's guard (decision 0050), as the
 * Factory UI opens it (`agentControllerClient.ts`): the Hub's prefix, no prefix of Mastra's, and no
 * retry of the client's own, since a write retried would say a message twice.
 */
export function sessionOf(conversationId: ConversationId) {
  const client = new MastraClient({
    baseUrl: BUILDER_ROUTES,
    apiPrefix: '',
    credentials: 'same-origin',
    retries: 0,
    fetch: hubClientFetch,
  })
  const session = client.getAgentController(BUILDER_CONTROLLER).session(conversationId)
  const path = `/agent-controller/${BUILDER_CONTROLLER}/sessions/${conversationId}`
  return {
    session,
    send: (content: string) => said(session.sendMessage(content)),
    stop: () => said(session.abort()),
    /** The transcript, oldest first, as Mastra's route serves it. */
    read: async () => {
      const { messages } = await said(
        session.listMessages(conversationId, {
          perPage: false,
          orderBy: { field: 'createdAt', direction: 'ASC' },
        }),
      )
      return messages
    },
    /**
     * A card's answer: the answers of `ask_user`, one per question (ours takes a list for a
     * multiple choice, which the client's type does not say), or the plan's decision.
     */
    answer: (toolCallId: string, resumeData: readonly Answer[] | PlanResume) =>
      said(
        session.request<{ ok: boolean }>(`${path}/tool-suspension`, {
          method: 'POST',
          body: { toolCallId, resumeData },
        }),
      ),
  }
}

export type BuilderSession = ReturnType<typeof sessionOf>

/** A call of Mastra's client, its refusal read as the Hub's failure it carries. */
async function said<T>(call: Promise<T>): Promise<T> {
  try {
    return await call
  } catch (error) {
    if (error instanceof MastraClientError) throw failureOfProblem(error.body)
    throw new HubFailure('INTERNAL_UNEXPECTED', { cause: error })
  }
}
