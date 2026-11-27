import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { MastraMemory } from '@mastra/core/memory'
import type { FailureLog } from '../../platform/failure.ts'
import type { MarkedKind } from './run.ts'
import { RUN_MARKS } from './run.ts'

/** What a release names: a company, and maybe one of its Projetos or one of its people. */
export type ReleaseScope = { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }

/**
 * Deletes each thread: its session first, so its run is aborted, then `each` (what its kind drops
 * with it), then the thread. A thread deleted twice, or a failure halfway, leaves what the next
 * removal finds again.
 */
export async function releaseThreads(
  deps: { controller: AgentController; memory: MastraMemory },
  ids: readonly string[],
  each?: (id: ConversationId) => Promise<void>,
): Promise<number> {
  for (const id of ids) {
    await deps.controller.deleteSession({ sessionId: id })
    await each?.(ConversationId.parse(id))
    await deps.memory.deleteThread(id)
  }
  return ids.length
}

/** The threads of a company, a person or a Projeto, by the marks each carries, every page. */
export async function threadsByMarks(
  memory: MastraMemory,
  marks: Record<string, string>,
): Promise<string[]> {
  const { threads } = await memory.listThreads({ filter: { metadata: marks }, perPage: false })
  return threads.map((thread) => thread.id)
}

/**
 * Deletes a marked kind's conversations that a removal names (the company, and maybe one person or
 * Projeto), by the kind's marks: each session, then `each` of the company (what its kind drops with
 * a conversation, its machine among them), then the thread; logs `code` with the count.
 */
export async function releaseByMarks(
  deps: { controller: AgentController; memory: MastraMemory; log: FailureLog },
  input: {
    kind: MarkedKind
    scope: ReleaseScope
    code:
      | 'ASSISTANT_CONVERSATIONS_RELEASED'
      | 'CONSTRUTOR_CONVERSATIONS_RELEASED'
      | 'AGENT_CONVERSATIONS_RELEASED'
    each?: (companyId: CompanyId) => (id: ConversationId) => Promise<void>
  },
): Promise<number> {
  const { scope } = input
  const marks = RUN_MARKS[input.kind]
  const ids = await threadsByMarks(deps.memory, {
    [marks.company]: scope.companyId,
    ...(scope.personId === undefined ? {} : { [marks.person]: scope.personId }),
    ...(scope.projectId === undefined ? {} : { [marks.project]: scope.projectId }),
  })
  const count = await releaseThreads(deps, ids, input.each?.(scope.companyId))
  deps.log.info({ companyId: scope.companyId, count }, input.code)
  return count
}
