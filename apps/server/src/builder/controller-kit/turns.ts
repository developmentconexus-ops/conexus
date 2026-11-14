import { randomUUID } from 'node:crypto'
import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { InputProcessor, OutputProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { TurnKey } from '../../hub/connectors/public.ts'
import { Failure } from '../../platform/failure.ts'
import { controllerIn } from '../controller-context/public.ts'
import type { QueueDeps, Turn } from '../model-accounts/public.ts'
import { setTurn, turnIn } from '../model-accounts/public.ts'
import type { Owner } from './kinds.ts'
import { turnOfOwner } from './memory.ts'

/**
 * A controller's turns by session, and the one owner of their end (code C26): a run takes its turn
 * in the accounts' queue (step 11) as Mastra reads its input, by the controller's `take`; every run
 * reads its input, and a resumed one takes it at its first step. The turn lets go of its accounts when the
 * controller says the run ended (`agent_end`), for every end: done, failed, stopped by Parar or by
 * the Hub's end, and then `ended` runs; a deleted session's run ends without one, so its deletion
 * lets go too. `take` answers `undefined` for a run that is not one of its conversations; the turn it
 * answers is put on the run's context here, once, so no `take` has to.
 */
export function sessionTurns(options: {
  id: string
  take: (requestContext: RequestContext) => Promise<Turn | undefined>
  ended?: (sessionId: ConversationId) => void
}) {
  const held = new Map<ConversationId, { turn: Turn; requestContext: RequestContext }>()
  const deleted = new WeakSet<RequestContext>()

  function letGo(sessionId: ConversationId): void {
    held.get(sessionId)?.turn.end()
    held.delete(sessionId)
  }

  async function takeFor(
    requestContext: RequestContext | undefined,
    abort: (reason: string) => never,
  ): Promise<void> {
    const { sessionId } = controllerIn(requestContext)
    if (requestContext === undefined || sessionId === undefined) {
      return abort('CONVERSATION_NOT_FOUND')
    }
    const turn = await options.take(requestContext)
    if (turn === undefined) return abort('CONVERSATION_NOT_FOUND')
    setTurn(requestContext, turn)
    held.set(sessionId, { turn, requestContext })
  }

  // A deleted session's run still ends its stream after the abort, and Mastra's memory saves that
  // end, creating the thread again when the delete got there first. Its result belongs to a
  // conversation that no longer exists: a tripwire keeps the memory processors, which run after
  // this one, from saving it.
  const deletedRun: OutputProcessor = {
    id: `${options.id}-deleted`,
    async processOutputResult({ messages, requestContext, abort }) {
      if (requestContext !== undefined && deleted.has(requestContext)) abort('CONVERSATION_DELETED')
      return messages
    },
  }

  const processor: InputProcessor = {
    id: options.id,
    async processInput({ requestContext, messages, abort }) {
      await takeFor(requestContext, abort)
      return messages
    },
    // A run Mastra resumes (an answered card) reads no input: its first step takes the turn.
    async processInputStep({ requestContext, abort }) {
      if (requestContext === undefined || turnIn(requestContext) === undefined)
        await takeFor(requestContext, abort)
      return {}
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
    controller.onSessionDeleted((session) => {
      const sessionId = ConversationId.parse(session.identity.getId())
      const run = held.get(sessionId)
      if (run !== undefined) deleted.add(run.requestContext)
      letGo(sessionId)
    })
  }

  return { processor, deletedRun, watch }
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

/**
 * The `take` of a controller whose conversations are an owner's: the turn of the scope the run
 * belongs to, with a new `TurnKey` on its context; `undefined` for a run that is not one of them.
 */
export function takeOfScope(deps: {
  queue: QueueDeps
  scopeOf: (requestContext: RequestContext) => Promise<Owner | undefined>
  turnKey: ReturnType<typeof turnKeyOn>
}) {
  return async (requestContext: RequestContext): Promise<Turn | undefined> => {
    const scope = await deps.scopeOf(requestContext)
    if (scope === undefined) return undefined
    const turn = await turnOfOwner(deps.queue, scope)
    deps.turnKey.start(requestContext)
    return turn
  }
}
