import type { ConversationId } from '@conexus/hub-api'
import type { Owner } from '../controller-kit/public.ts'
import type { WriteOf } from '../conversation/public.ts'
import type { AgentRun } from './agent.ts'
import type { AgentReads } from './registry.ts'

/**
 * The write a tool of a conversation's agent is (step 24.5), from the version it runs or its
 * draft: the log of a card's answer says which connection and operation it was about, and a
 * Recusar has no send to join it to.
 */
export function writeOfAgents(
  keptRun: (owner: Owner, id: ConversationId) => Promise<AgentRun | undefined>,
  reads: Pick<AgentReads, 'activeOf' | 'draftOf'>,
) {
  return async (input: Parameters<WriteOf>[0]): ReturnType<WriteOf> => {
    const { companyId, personId, conversationId, toolName } = input
    const run = await keptRun({ companyId, personId }, conversationId)
    if (run === undefined) return undefined
    const version =
      run.kind === 'DRAFT'
        ? await reads.draftOf(run.scope, run.agentId)
        : await reads.activeOf(run.scope, run.agentId)
    for (const tool of version?.tools ?? []) {
      if (tool.kind === 'PRESET' && `tool_${tool.slug}` === toolName) {
        return { connectionId: tool.connectionId, operation: tool.operation }
      }
    }
    return undefined
  }
}
