import type { ConversationId, Effort, ModelId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { StorageThreadType } from '@mastra/core/memory'
import type { Memory } from '@mastra/memory'
import { Failure } from '../../platform/failure.ts'
import type { Kept, Owner } from '../controller-kit/public.ts'
import { openSession, resourceOf } from '../controller-kit/public.ts'
import type { QueueDeps } from '../model-accounts/public.ts'
import type { InProject } from '../tools/public.ts'

/**
 * The marks of a Construtor thread, stamped by `createSession({ tags })`: its own keys, so no other
 * controller's sweep takes it and the Projeto's removal finds it. The Hub keeps no row.
 */
export const CONSTRUTOR_MARK = {
  company: 'conexusConstrutorCompany',
  person: 'conexusConstrutorPerson',
  project: 'conexusConstrutorProject',
} as const

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
  const tags = {
    [CONSTRUTOR_MARK.company]: scope.companyId,
    [CONSTRUTOR_MARK.person]: scope.personId,
    [CONSTRUTOR_MARK.project]: scope.projectId,
  }
  async function keep(): Promise<Kept> {
    const thread = await deps.memory.getThreadById({
      threadId: id,
      resourceId: resourceOf('construtor', owner),
    })
    if (thread === null) return { made: true }
    return { made: false, same: thread.metadata?.[CONSTRUTOR_MARK.project] === scope.projectId, id }
  }
  return openSession(deps, {
    ...{ kind: 'construtor', owner, id, tags, keep },
    ...{ model: input.model, effort: input.effort },
  })
}

/** The thread a conversation of the person's is, which `openSession` has just made or found. */
export async function threadOf(
  memory: Memory,
  owner: Owner,
  id: ConversationId,
): Promise<StorageThreadType> {
  const thread = await memory.getThreadById({
    threadId: id,
    resourceId: resourceOf('construtor', owner),
  })
  if (thread === null) throw new Failure('CONVERSATION_NOT_FOUND')
  return thread
}
