import { randomUUID } from 'node:crypto'
import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { InputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { TurnKey } from '../../hub/connectors/public.ts'
import { turnOfOwner } from '../conversation/public.ts'
import type { QueueDeps, Turn } from '../model-accounts/public.ts'
import { setTurn } from '../model-accounts/public.ts'
import type { ScopeOf } from './context.ts'
import type { AssistantMachines } from './machine.ts'

const TURN_PROCESSOR = 'conexus-assistant-turn'
/** Where the run's context holds the turn's key, which the company's door counts the 50 calls by. */
const TURN_KEY = 'conexus-assistant-turn-key'

const Session = z.object({ sessionId: ConversationId })

/** The key of the turn the run is, put on its context by the turn's processor. */
export function turnKeyIn(requestContext: RequestContext): TurnKey | undefined {
  return TurnKey.safeParse(requestContext.get(TURN_KEY)).data
}

/**
 * The Assistant's turns (step 24.1, U2), and the one owner of their end (code C26): a run of a
 * conversation takes its owner's turn in the accounts' queue (step 11) as Mastra reads its input,
 * with a new `TurnKey`, and no Projeto (`Runs`): the controller already sends one message at a time
 * to a conversation. Every run reads its input: Mastra skips it only on a resume, and nothing in
 * the Assistant suspends (no card, no plan, no approval). The turn lets go of its accounts when
 * the controller says the run ended (`agent_end`), for every end: done, failed, stopped by Parar
 * or by the Hub's end; a deleted session's run ends without one, so its deletion lets go too.
 */
export function assistantTurns(deps: {
  queue: QueueDeps
  scopeOf: ScopeOf
  machines: AssistantMachines
}) {
  const held = new Map<ConversationId, Turn>()

  function letGo(sessionId: ConversationId): void {
    held.get(sessionId)?.end()
    held.delete(sessionId)
  }

  /** The turn ended: the conversation's machine sleeps until the next question; a failed pause is logged there. */
  function sleep(sessionId: ConversationId): void {
    void deps.machines.stop(sessionId)
  }

  async function take(
    requestContext: RequestContext | undefined,
    abort: (reason: string) => never,
  ): Promise<void> {
    const scope = requestContext === undefined ? undefined : await deps.scopeOf(requestContext)
    const session = Session.safeParse(requestContext?.get('controller'))
    if (requestContext === undefined || scope === undefined || !session.success) {
      return abort('CONVERSATION_NOT_FOUND')
    }
    const turn = await turnOfOwner(deps.queue, scope)
    held.set(session.data.sessionId, turn)
    setTurn(requestContext, turn)
    requestContext.set(TURN_KEY, TurnKey.parse(randomUUID()))
  }

  const processor: InputProcessor = {
    id: TURN_PROCESSOR,
    async processInput({ requestContext, messages, abort }) {
      await take(requestContext, abort)
      return messages
    },
  }

  function watch(controller: AgentController): void {
    controller.onSessionCreated((session) => {
      const sessionId = ConversationId.parse(session.identity.getId())
      session.subscribe((event) => {
        if (event.type !== 'agent_end') return
        letGo(sessionId)
        sleep(sessionId)
      })
    })
    controller.onSessionDeleted((session) => letGo(ConversationId.parse(session.identity.getId())))
  }

  return { processor, watch }
}
