import { ToolSearchProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import type { AccessView } from '../../../hub/access/public.ts'
import { readTarget, typedReads } from '../connectors/typed-reads.ts'
import type { CompanyToolDeps } from './factory.ts'
import { connectorAccess } from './factory.ts'
import type { CompanyConnection, CompanyToolScope } from './scope.ts'

/** Whether the view lists the typed read: a system of its connector that lists its operation. */
function lists(view: AccessView, toolName: string): boolean {
  const target = readTarget(toolName)
  if (target === undefined) return false
  return view
    .list('system')
    .some(
      (system) =>
        system.connector === target.connector &&
        system.reads.some((read) => read.operation === target.operation),
    )
}

/**
 * The typed reads on demand (`ToolSearchProcessor`, `reference-processors-tool-search-processor.md`):
 * the catalog is fixed when it is made, the same for every request; each request's `filter` passes
 * only the reads its run's view lists, and each read goes through the run's door
 * (`storage: 'context'`: the load lives in the messages).
 */
export function companyReadSearch<C extends CompanyConnection>(
  scopeOf: (requestContext: RequestContext) => Promise<CompanyToolScope<C> | undefined>,
  deps: CompanyToolDeps,
): ToolSearchProcessor {
  return new ToolSearchProcessor({
    tools: typedReads(async (requestContext) => {
      const scope = await scopeOf(requestContext)
      return scope === undefined ? undefined : connectorAccess(scope, 'assistant', deps)
    }),
    storage: 'context',
    search: { topK: 3, autoLoad: true },
    filter: async ({ toolName, requestContext }) => {
      const scope = requestContext === undefined ? undefined : await scopeOf(requestContext)
      return scope !== undefined && lists(scope.view, toolName)
    },
  })
}
