import type { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import { ConversationId } from '@conexus/hub-api'
import type { AgentController } from '@mastra/core/agent-controller'
import type { MastraMemory } from '@mastra/core/memory'

/** What a release names: a company, and maybe one of its Projetos or one of its people. */
export type ReleaseScope = { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }

/**
 * Deletes each thread: its session first, so its run is aborted, then the owner's step (the
 * Assistant's machine), then the thread (data D17). A thread deleted twice, or a failure halfway,
 * leaves what the next removal finds again.
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
