import { ConversationId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'

const Controller = z.object({ sessionId: ConversationId })

/**
 * The conversation a Mastra run is: the controller names the run's session, whose id is the
 * conversation's (decision 0050), as Factory reads it (`credential-policy.ts:37-39`).
 */
export function conversationIn(context: RequestContext | undefined): ConversationId | undefined {
  const found = Controller.safeParse(context?.get('controller'))
  return found.success ? found.data.sessionId : undefined
}
