import { randomUUID } from 'node:crypto'
import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { TurnKey } from '../../hub/connectors/public.ts'
import { Failure } from '../../platform/failure.ts'
import type { Turn } from '../model-accounts/public.ts'

const Session = z.object({ sessionId: ConversationId })

/**
 * A controller's turns by session, and the one owner of their end (code C26): a run takes its turn
 * in the accounts' queue (step 11) as Mastra reads its input, by the controller's `take`; every run
 * reads its input, Mastra skips it only on a resume. The turn lets go of its accounts when the
 * controller says the run ended (`agent_end`), for every end: done, failed, stopped by Parar or by
 * the Hub's end, and then `ended` runs; a deleted session's run ends without one, so its deletion
 * lets go too. `take` answers `undefined` for a run that is not one of its conversations.
 */
export function sessionTurns(options: {
  id: string
  take: (requestContext: RequestContext) => Promise<Turn | undefined>
  ended?: (sessionId: ConversationId) => void
}) {
  const held = new Map<ConversationId, Turn>()

  function letGo(sessionId: ConversationId): void {
    held.get(sessionId)?.end()
    held.delete(sessionId)
  }

  const processor: InputProcessor = {
    id: options.id,
    async processInput({ requestContext, messages, abort }) {
      const session = Session.safeParse(requestContext?.get('controller'))
      if (requestContext === undefined || !session.success) return abort('CONVERSATION_NOT_FOUND')
      const turn = await options.take(requestContext)
      if (turn === undefined) return abort('CONVERSATION_NOT_FOUND')
      held.set(session.data.sessionId, turn)
      return messages
    },
  }

  function watch(controller: AgentController): void {
    controller.onSessionCreated((session) => {
      const sessionId = ConversationId.parse(session.identity.getId())
      session.subscribe((event) => {
        if (event.type !== 'agent_end') return
        letGo(sessionId)
        options.ended?.(sessionId)
      })
    })
    controller.onSessionDeleted((session) => letGo(ConversationId.parse(session.identity.getId())))
  }

  return { processor, watch }
}

/**
 * The key a controller's run counts the company door's calls by, kept on its request context under
 * the controller's own name: `start` puts a new one when the turn is taken, `of` reads it for a
 * connector call and fails when there is no turn.
 */
export function turnKeyOn(name: string) {
  return {
    start(requestContext: RequestContext): void {
      requestContext.set(name, TurnKey.parse(randomUUID()))
    },
    of(requestContext: RequestContext): TurnKey {
      const turn = TurnKey.safeParse(requestContext.get(name))
      if (!turn.success) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'CONNECTOR_TOOL_WITHOUT_TURN' },
        })
      }
      return turn.data
    },
  }
}
