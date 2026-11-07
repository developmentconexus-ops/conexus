import type { RequestContext } from '@mastra/core/request-context'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { connectorTools } from '../connectors/public.ts'
import { turnKey } from './turn.ts'

type AssistantConnectors = Connectors['assistant']
type AssistantConnection = Awaited<ReturnType<AssistantConnectors['connections']>>[number]

/**
 * The connector tools of a conversation (U1's door): the chosen connections its place offers, each
 * call counted by the turn's key; the model gets the cut, never the whole answer. The notebook's
 * write is the Builder's tool, for who may manage connections and never in an automation's run
 * (step 24.3.5).
 */
export function assistantConnectorTools(
  deps: { connectors: AssistantConnectors; log: FailureLog },
  a: {
    scope: SessionScope
    chosen: readonly AssistantConnection[]
    savedAt: (requestContext: RequestContext) => string
    mayNote: boolean
  },
) {
  const { scope } = a
  const access = {
    connections: a.chosen,
    savedAt: a.savedAt,
    log: deps.log,
    read: (call, requestContext) =>
      deps.connectors.read(scope, { ...call, turn: turnKey.of(requestContext) }),
    notes: (connectionId) => deps.connectors.notes(scope, connectionId),
    wording: { whose: 'this conversation chose', limit: '50 connector calls per answer' },
  } satisfies Parameters<typeof connectorTools>[0]
  if (!a.mayNote) return connectorTools(access, { noteSave: false })
  return connectorTools(access, {
    noteSave: true,
    save: (call, requestContext) =>
      deps.connectors.saveNote(scope, { ...call, turn: turnKey.of(requestContext) }),
  })
}

/**
 * `reads/<turn>-<n>.json`: the turn's first 8 characters and the read's number in the run, so one
 * turn never writes over another; the count lives with the agent, one per run.
 */
export function readsFiles(): (requestContext: RequestContext) => string {
  const readsOfRun = new WeakMap<RequestContext, number>()
  return (requestContext) => {
    const turn = turnKey.of(requestContext)
    const n = (readsOfRun.get(requestContext) ?? 0) + 1
    readsOfRun.set(requestContext, n)
    return `reads/${turn.slice(0, 8)}-${n}.json`
  }
}
