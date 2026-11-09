import type { FailureCode } from '@conexus/hub-api'
import type { AgentController, Session as ControllerSession } from '@mastra/core/agent-controller'
import { sessionTurns, turnKeyOn, turnOfOwner } from '../controller-kit/public.ts'
import { failureOf, modelFailure, TurnTally } from '../conversation/public.ts'
import type { ConversationMachines } from '../machine/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { ScopeOf } from './context.ts'

const TURN_PROCESSOR = 'conexus-assistant-turn'

/** The key the company's door counts the 50 calls of a turn by, on the run's context (the kit's owner of it). */
export const turnKey = turnKeyOn('conexus-assistant-turn-key')

/**
 * The Assistant's turns (step 24.1, U2) on the kit's owner of their end: a run of a conversation
 * takes its owner's turn with a new `TurnKey`, and no Projeto (`Runs`): the controller already
 * sends one message at a time to a conversation. A card (`ask_user`) suspends the run, and an
 * automation's run ends then (`endOf`). When the turn ends, the conversation's machine sleeps until
 * the next question; a failed pause is logged there.
 */
export function assistantTurns(deps: {
  queue: QueueDeps
  scopeOf: ScopeOf
  machines: ConversationMachines
}) {
  return sessionTurns({
    id: TURN_PROCESSOR,
    async take(requestContext) {
      const scope = await deps.scopeOf(requestContext)
      if (scope === undefined) return undefined
      const turn = await turnOfOwner(deps.queue, scope)
      turnKey.start(requestContext)
      return turn
    },
    ended: (sessionId) => void deps.machines.stop(sessionId),
  })
}

export type TurnEnd = { kind: 'DONE' } | { kind: 'FAILED'; code: FailureCode }

/** How a turn ended, by the reason of its `agent_end`, the failure an `error` event gave and the tally. */
function endOf(
  reason: Parameters<typeof modelFailure>[0],
  failure: FailureCode | undefined,
  tally: TurnTally,
): TurnEnd {
  if (reason === 'aborted') return { kind: 'FAILED', code: 'INTERRUPTED' }
  if (reason === 'suspended') return { kind: 'FAILED', code: 'INTERNAL_UNEXPECTED' }
  const code = failure ?? modelFailure(reason, tally)
  return code === undefined ? { kind: 'DONE' } : { kind: 'FAILED', code }
}

/**
 * How the next turn of `session` ends, by the Builder's map. Subscribe before sending: a model's
 * failure comes as an event and `sendMessage` returns without throwing. A session deleted mid-run
 * ends with no `agent_end` (Mastra's `deleteSession`). `stop` lets go of both listeners when the
 * caller leaves without waiting for `ended`.
 */
export function turnEnd(
  controller: AgentController,
  session: ControllerSession,
): { ended: Promise<TurnEnd>; stop(): void } {
  const id = session.identity.getId()
  const { promise: ended, resolve } = Promise.withResolvers<TurnEnd>()
  const tally = new TurnTally()
  let failure: FailureCode | undefined
  function stop(): void {
    stopHearing()
    stopWatching()
  }
  function done(end: TurnEnd): void {
    stop()
    resolve(end)
  }
  const stopHearing = session.subscribe((event) => {
    tally.heard(event)
    if (event.type === 'error') failure ??= failureOf(event.error)?.code
    if (event.type === 'agent_end') done(endOf(event.reason ?? 'complete', failure, tally))
  })
  const stopWatching = controller.onSessionDeleted((deleted) => {
    if (deleted.identity.getId() === id) done({ kind: 'FAILED', code: 'INTERRUPTED' })
  })
  return { ended, stop }
}
