import type { RequestContext } from '@mastra/core/request-context'
import { TURNS_KEPT } from '../../hub/connectors/public.ts'
import { turnKey } from './turn.ts'

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
