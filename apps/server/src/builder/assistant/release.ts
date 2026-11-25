import type { AgentController } from '@mastra/core/agent-controller'
import type { ConversationMachines } from '../../harness/machine/public.ts'
import type { ReleaseScope } from '../../harness/spec/public.ts'
import { releaseByMarks } from '../../harness/spec/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
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
  await releaseByMarks(deps, {
    kind: 'assistant',
    scope,
    code: 'ASSISTANT_CONVERSATIONS_RELEASED',
    each: (id) => deps.machines.kill(id),
  })
}
