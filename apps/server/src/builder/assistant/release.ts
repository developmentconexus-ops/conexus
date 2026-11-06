import type { AgentController } from '@mastra/core/agent-controller'
import type { FailureLog } from '../../platform/failure.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import { releaseThreads, threadsByMarks } from '../controller-kit/public.ts'
import type { ConversationMachines } from '../machine/public.ts'
import { SESSION_MARK } from './context.ts'
import type { assistantMemory } from './memory.ts'

/**
 * Deletes the Assistant's threads of a company, of one person of it, or of one Projeto of it, found
 * by the marks every thread carries, after the Builder's: each session first, so its run is
 * aborted, then its machines (S36), then its thread (data D17).
 */
export async function releaseConversations(
  deps: {
    controller: AgentController
    memory: ReturnType<typeof assistantMemory>
    machines: ConversationMachines
    log: FailureLog
  },
  scope: ReleaseScope,
): Promise<void> {
  const ids = await threadsByMarks(deps.memory, {
    [SESSION_MARK.company]: scope.companyId,
    ...(scope.personId === undefined ? {} : { [SESSION_MARK.person]: scope.personId }),
    ...(scope.projectId === undefined ? {} : { [SESSION_MARK.project]: scope.projectId }),
  })
  const count = await releaseThreads(deps, ids, (id) => deps.machines.kill(id))
  deps.log.info({ companyId: scope.companyId, count }, 'ASSISTANT_CONVERSATIONS_RELEASED')
}
