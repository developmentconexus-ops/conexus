import { ToolSearchProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { Connectors, SessionScope } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { AccessOf } from '../connectors/public.ts'
import { offersRead, typedReads } from '../connectors/public.ts'
import { ASSISTANT_LIMIT, assistantAccess } from './connector-access.ts'

type Chosen = Parameters<typeof offersRead>[1]
type Chosens = Parameters<typeof assistantAccess>[1]['chosen']

/**
 * The Assistant's reads on demand (U6): the catalog of typed reads is the same for every request;
 * each request sees the reads of its chosen connections that the role allows, in every phase, and a
 * search loads them (`storage: 'context'`: the load lives in the messages).
 */
export function typedSearch(
  deps: { connectors: Connectors['assistant']; log: FailureLog },
  a: {
    scopeOf: (requestContext: RequestContext) => Promise<SessionScope | undefined>
    chosenOf: (requestContext: RequestContext) => Promise<Chosen & Chosens>
    savedAt: (requestContext: RequestContext) => string
  },
): ToolSearchProcessor {
  const accessOf: AccessOf = async (requestContext) => {
    const scope = await a.scopeOf(requestContext)
    if (scope === undefined) return undefined
    return assistantAccess(deps, {
      scope,
      chosen: await a.chosenOf(requestContext),
      savedAt: a.savedAt,
    })
  }
  return new ToolSearchProcessor({
    tools: typedReads(accessOf, ASSISTANT_LIMIT),
    storage: 'context',
    search: { topK: 3, autoLoad: true },
    filter: async ({ toolName, requestContext }) =>
      requestContext !== undefined && offersRead(toolName, await a.chosenOf(requestContext)),
  })
}
