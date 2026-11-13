import type { RequestContext } from '@mastra/core/request-context'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import { TURNS_KEPT } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ConnectorAccess } from '../connectors/public.ts'
import { connectorTools } from '../connectors/public.ts'
import type { InventoryAsk, InventoryDoor } from '../ontology/public.ts'
import { turnKey } from './turn.ts'

type AssistantConnectors = Connectors['assistant']
type AssistantConnection = Awaited<ReturnType<AssistantConnectors['connections']>>[number]

/** The Assistant's limit, as its read tools say it. */
export const ASSISTANT_LIMIT = '50 connector calls per answer'

type Conversation = { scope: SessionScope; chosen: readonly AssistantConnection[] }

/**
 * The conversation's door (U1): the chosen connections its place offers, each call counted by the
 * turn's key; the model gets the cut, never the whole answer.
 */
export function assistantAccess(
  deps: { connectors: AssistantConnectors; log: FailureLog },
  a: Conversation & { savedAt?: (requestContext: RequestContext) => string },
): ConnectorAccess {
  const { scope } = a
  return {
    connections: a.chosen,
    savedAt: a.savedAt,
    log: deps.log,
    read: (call, requestContext) =>
      deps.connectors.read(scope, { ...call, turn: turnKey.of(requestContext) }),
    notes: (connectionId) => deps.connectors.notes(scope, connectionId),
    wording: { whose: 'this conversation chose', limit: ASSISTANT_LIMIT },
  }
}

/**
 * The notebook tools of a conversation: its reads are the typed ones (`typed-reads.ts`), never
 * `connector_read`. The notebook's write is the Builder's tool, for who may manage connections and
 * never in an automation's run (step 24.3.5).
 */
export function assistantConnectorTools(
  deps: { connectors: AssistantConnectors; inventory: InventoryDoor; log: FailureLog },
  a: Conversation & { mayNote: boolean },
) {
  const { scope } = a
  const access = assistantAccess(deps, a)
  const inventory: InventoryAsk = (call) =>
    deps.inventory.search({ companyId: scope.companyId, ...call })
  if (!a.mayNote) return connectorTools(access, { noteSave: false, reads: false, inventory })
  return connectorTools(access, {
    noteSave: true,
    reads: false,
    inventory,
    save: (call, requestContext) =>
      deps.connectors.saveNote(scope, { ...call, turn: turnKey.of(requestContext) }),
  })
}

/**
 * `reads/<turn>-<n>.json`: the turn's first 8 characters and the read's number in the turn, so one
 * turn never writes over another and the helper's reads, which run on another context, number after
 * the main agent's; the count is by the turn's key, the oldest forgotten past `TURNS_KEPT`.
 */
export function readsFiles(): (requestContext: RequestContext) => string {
  const readsOfTurn = new Map<string, number>()
  return (requestContext) => {
    const turn = turnKey.of(requestContext)
    const n = (readsOfTurn.get(turn) ?? 0) + 1
    readsOfTurn.delete(turn)
    readsOfTurn.set(turn, n)
    const [oldest] = readsOfTurn.keys()
    if (readsOfTurn.size > TURNS_KEPT && oldest !== undefined) readsOfTurn.delete(oldest)
    return `reads/${turn.slice(0, 8)}-${n}.json`
  }
}
