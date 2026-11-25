import type { RequestContext } from '@mastra/core/request-context'
import { oncePerRun, principalOf } from '../../harness/spec/public.ts'
import type { Access, Principal } from '../../hub/access/public.ts'
import type { CompanyConnection, CompanyToolScope } from '../company-tools/public.ts'
import { companyToolScope } from '../company-tools/public.ts'
import type { RunOf } from './context.ts'
import { speakersOf } from './context.ts'
import { maysOf } from './mays.ts'

/** The run's company tools' scope, once per run; none outside a conversation. */
export type ScopeOf<C extends CompanyConnection> = (
  requestContext: RequestContext,
) => Promise<CompanyToolScope<C> | undefined>

/**
 * What each run reads once, for its prompt and its tools together: the speakers' roles, what they
 * may, and the company tools' scope, with its notebook's write as the speaker may.
 */
export function runReads<C extends CompanyConnection>(
  deps: Parameters<typeof speakersOf>[0] & {
    access: Pick<Access, 'viewOf'>
    connectors: { connections(principal: Principal): Promise<readonly C[]> }
  },
  scopeOf: RunOf,
) {
  const speakersFor = oncePerRun(async (requestContext: RequestContext) => {
    const scope = await scopeOf(requestContext)
    return scope === undefined ? undefined : speakersOf(deps, scope)
  })
  const maysFor = maysOf(
    deps.identity,
    speakersFor,
    async (requestContext) => (await scopeOf(requestContext))?.attended === false,
  )
  const toolScopeOf: ScopeOf<C> = oncePerRun(async (requestContext) => {
    const run = await scopeOf(requestContext)
    if (run === undefined) return undefined
    const { note } = await maysFor(requestContext)
    return companyToolScope(
      run,
      {
        access: deps.access,
        connections: (each) => deps.connectors.connections(principalOf(each)),
      },
      { noteSave: note, appData: { kind: 'NONE' } },
    )
  })
  return { speakersFor, maysFor, toolScopeOf }
}
