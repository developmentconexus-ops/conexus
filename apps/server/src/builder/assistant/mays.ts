import type { RequestContext } from '@mastra/core/request-context'
import { oncePerRun } from '../controller-kit/public.ts'
import type { Mays, Speakers } from './instructions.ts'

/** What the speaker's role and the run allow, once per run: the tools and the block's sentences read it (one owner). */
export function maysOf(
  identity: {
    allows(role: Speakers['role'], permission: 'manageAutomations' | 'manageConnections'): boolean
  },
  speakersFor: (requestContext: RequestContext) => Promise<Speakers | undefined>,
  automationRun: (requestContext: RequestContext) => Promise<boolean>,
) {
  return oncePerRun(async (requestContext): Promise<Mays> => {
    const speakers = await speakersFor(requestContext)
    const byAutomation = await automationRun(requestContext)
    return {
      byAutomation,
      automate: speakers !== undefined && identity.allows(speakers.role, 'manageAutomations'),
      note:
        speakers !== undefined &&
        !byAutomation &&
        identity.allows(speakers.role, 'manageConnections'),
    }
  })
}
