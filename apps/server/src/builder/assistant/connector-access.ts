import type { RequestContext } from '@mastra/core/request-context'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import { TURNS_KEPT } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { ConceptProposeCall, ConnectorAccess } from '../connectors/public.ts'
import { connectorTools, NOT_GRANTED } from '../connectors/public.ts'
import type { InventoryAsk, OntologyDoor } from '../ontology/public.ts'
import { conversationIn } from '../runs/public.ts'
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
    wording: { whose: 'this conversation chose', limit: ASSISTANT_LIMIT },
  }
}

/**
 * The connector tools of a conversation: its reads are the typed ones (`typed-reads.ts`), never
 * `connector_read`. Every member proposes concepts (Q1), never in an automation's run.
 */
export function assistantConnectorTools(
  deps: { connectors: AssistantConnectors; ontology: OntologyDoor; log: FailureLog },
  a: Conversation & { mayPropose: boolean },
) {
  const { scope } = a
  const access = assistantAccess(deps, a)
  const inventory: InventoryAsk = (call) =>
    deps.ontology.search({ companyId: scope.companyId, ...call })
  const concepts: ConceptProposeCall = async (call, requestContext) => {
    const turn = turnKey.of(requestContext)
    const door = await deps.connectors.concepts(scope, { connectionId: call.connectionId, turn })
    if (door === undefined) return NOT_GRANTED
    return deps.ontology.propose({
      ...{ ...call, companyId: scope.companyId, personId: scope.personId, door },
      ...{ agent: 'assistant', conversationId: conversationIn(requestContext) ?? null },
    })
  }
  return connectorTools(access, {
    reads: false,
    inventory,
    ...(a.mayPropose ? { concepts } : {}),
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
