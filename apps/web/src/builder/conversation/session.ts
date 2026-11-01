import type { Answer, ASSISTANT_CONTROLLER, ConversationId, ProjectId } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_ROUTES } from '@conexus/hub-api'
import type { PlanResume } from '@mastra/client-js'
import { MastraClient, MastraClientError } from '@mastra/client-js'
import { failureOfProblem, HubFailure, hubClientFetch } from '../../platform/hub.ts'
import type { Outgoing } from './attachments.ts'

/**
 * The conversation's session on Mastra's own routes, behind the Hub's guard (decision 0050), as the
 * Factory UI opens it (`agentControllerClient.ts`): the Hub's prefix, no prefix of Mastra's, and no
 * retry of the client's own, since a write retried would say a message twice. The Builder's and the
 * Assistant's conversations are the same session on two controllers (step 24.1, `H1`).
 */
export type Controller = typeof BUILDER_CONTROLLER | typeof ASSISTANT_CONTROLLER

/**
 * Whose conversation it is: the Builder's, with the Projeto whose Prévia and files its runs change,
 * or the Assistant's, which has none (step 24.1, U4).
 */
export type Place =
  | { controller: typeof BUILDER_CONTROLLER; projectId: ProjectId }
  | { controller: typeof ASSISTANT_CONTROLLER }

export function sessionOf(
  conversationId: ConversationId,
  controller: Controller = BUILDER_CONTROLLER,
) {
  const client = new MastraClient({
    baseUrl: BUILDER_ROUTES,
    apiPrefix: '',
    credentials: 'same-origin',
    retries: 0,
    fetch: hubClientFetch,
  })
  const session = client.getAgentController(controller).session(conversationId)
  const path = `/agent-controller/${controller}/sessions/${conversationId}`
  return {
    session,
    send: (outgoing: Outgoing) =>
      said(session.sendMessage({ content: outgoing.content, files: [...outgoing.files] })),
    stop: () => said(session.abort()),
    /** The model, effort and tasks the conversation is on, as Factory UI hydrates (`session.state`). */
    state: () => said(session.state({ threadId: conversationId })),
    /**
     * The newest `limit` messages, oldest first: Mastra's own paging, as the Factory UI reads a
     * thread (`useAgentControllerThreadMessages.ts`, `session.listMessages(threadId, limit)`).
     */
    read: (limit: number) => said(session.listMessages(conversationId, limit)),
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
