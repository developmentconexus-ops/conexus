import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { FailureLog } from '../../platform/failure.ts'
import type { ReleaseScope } from '../conversation/public.ts'
import { SESSION_MARK } from './context.ts'
import type { AssistantMachines } from './machine.ts'
import type { assistantMemory } from './memory.ts'

/**
 * Deletes the Assistant's threads of a company, of one person of it, or of one Projeto of it, found
 * by the marks every thread carries (`listThreads` by metadata, every page), after the Builder's:
 * each session first, so its run is aborted, then its machines (S36), then its thread (data D17).
 * A thread deleted twice, or a failure halfway, leaves what the next removal finds again.
 */
export async function releaseConversations(
  deps: {
    controller: AgentController
    memory: ReturnType<typeof assistantMemory>
    machines: AssistantMachines
    log: FailureLog
  },
  scope: ReleaseScope,
): Promise<void> {
  const metadata = {
    [SESSION_MARK.company]: scope.companyId,
    ...(scope.personId === undefined ? {} : { [SESSION_MARK.person]: scope.personId }),
    ...(scope.projectId === undefined ? {} : { [SESSION_MARK.project]: scope.projectId }),
  }
  const { threads } = await deps.memory.listThreads({ filter: { metadata }, perPage: false })
  for (const thread of threads) {
    await deps.controller.deleteSession({ sessionId: thread.id })
    await deps.machines.kill(ConversationId.parse(thread.id))
    await deps.memory.deleteThread(thread.id)
  }
  deps.log.info(
    { companyId: scope.companyId, count: threads.length },
    'ASSISTANT_CONVERSATIONS_RELEASED',
  )
}
