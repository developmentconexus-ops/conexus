import type { RequestContext } from '@mastra/core/request-context'
import { networkScopes } from '../../harness/network/public.ts'
import type { Mays, Speakers } from '../../harness/spec/public.ts'
import { oncePerRun } from '../../harness/spec/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'

/** What the speaker's role and the run allow, once per run: the tools and the block's sentences read it (one owner). */
export function maysOf(
  identity: Pick<IdentityPorts, 'allows'>,
  speakersFor: (requestContext: RequestContext) => Promise<Speakers | undefined>,
  automationRun: (requestContext: RequestContext) => Promise<boolean>,
) {
  return oncePerRun(async (requestContext): Promise<Mays> => {
    const speakers = await speakersFor(requestContext)
    const byAutomation = await automationRun(requestContext)
    return {
      byAutomation,
      automate: speakers !== undefined && identity.allows(speakers.role, 'manageAutomations'),
      companyMemory:
        speakers !== undefined && identity.allows(speakers.role, 'manageCompanyMemory'),
      note:
        speakers !== undefined &&
        !byAutomation &&
        identity.allows(speakers.role, 'manageConnections'),
      network: speakers === undefined || byAutomation ? [] : networkScopes(identity, speakers.role),
    }
  })
}
