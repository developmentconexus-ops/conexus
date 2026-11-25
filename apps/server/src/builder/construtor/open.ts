import type { ConversationId, Effort, ModelId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { Memory } from '@mastra/memory'
import type { QueueDeps } from '../../harness/model-accounts/public.ts'
import type { Kept } from '../../harness/spec/public.ts'
import { marksOf, openSession, RUN_MARKS, resourceOf } from '../../harness/spec/public.ts'
import type { InProject } from '../tools/public.ts'

/**
 * The marks a Construtor conversation's thread is born with, which a session recovered later must
 * carry too: its own keys, so no other controller's sweep takes it and the Projeto's removal finds
 * it. The Hub keeps no row.
 */
export function construtorMarks(scope: InProject): Record<string, string> {
  return marksOf('construtor', scope)
}

/**
 * Opens a conversation of the person's with the Construtor in the Projeto (`openSession` of the
 * kit, no row of the Hub): the id is the attempt's, so a repeat finds the same thread, and one
 * that names another Projeto is `IDEMPOTENCY_CONFLICT` by the thread's marks.
 */
export function openConstrutor(
  deps: { controller: AgentController; memory: Memory; queue: QueueDeps },
  input: {
    scope: InProject
    id: ConversationId
    model?: ModelId | undefined
    effort?: Effort | undefined
  },
) {
  const { scope, id } = input
  const owner = { companyId: scope.companyId, personId: scope.personId }
  const tags = construtorMarks(scope)
  async function keep(): Promise<Kept> {
    const thread = await deps.memory.getThreadById({
      threadId: id,
      resourceId: resourceOf('construtor', owner),
    })
    if (thread === null) return { made: true }
    return {
      made: false,
      same: thread.metadata?.[RUN_MARKS.construtor.project] === scope.projectId,
      id,
    }
  }
  return openSession(deps, {
    ...{ kind: 'construtor', owner, id, tags, keep },
    ...{ model: input.model, effort: input.effort },
  })
}
