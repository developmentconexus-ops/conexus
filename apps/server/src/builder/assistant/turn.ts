import type { FailureCode } from '@conexus/hub-api'
import type { AgentController, Session as ControllerSession } from '@mastra/core/agent-controller'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import { takeOfScope, turnKeyOn } from '../../harness/spec/public.ts'
import { failureOf, modelFailure, TurnTally } from '../../harness/turn/public.ts'
import type { RunOf } from './context.ts'

const TURN_PROCESSOR = 'conexus-assistant-turn'

/** The key the company's door counts a turn's `CONNECTOR_CALLS_PER_TURN` calls by, on the run's context (the kit's owner of it). */
export const turnKey = turnKeyOn('conexus-assistant-turn-key')

/**
 * The Assistant's turn on the ficha (step 24.1, U2): a run of a conversation takes its owner's turn
 * with a new `TurnKey`, and no Projeto (`Runs`): the controller already sends one message at a time
 * to a conversation. A card (`ask_user`) suspends the run, and an automation's run ends then
 * (`endOf`). The turn's end leaves the conversation's machine running: E2B pauses it on its own
 * timeout, and a later question before then reuses it.
 */
export function assistantTurn(deps: { queue: QueueDeps; scopeOf: RunOf }) {
  return {
    kind: 'SESSION',
    id: TURN_PROCESSOR,
    take: takeOfScope({
      ...{ queue: deps.queue, turnKey },
      scopeOf: async (requestContext) => (await deps.scopeOf(requestContext))?.owner,
    }),
  } as const
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
