import type { AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import { useQueryClient } from '@tanstack/react-query'
import { writeFailureText } from '../../platform/hub.ts'
import { UNCONFIRMED_CREATION, useStartConversation } from '../conversation/public.ts'
import { agentConversationsQuery } from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * Opens a new conversation of the person's with the agent, with its published version or, with
 * `draft`, the test one with its draft, and goes to it; a refusal is the sentence `error` holds.
 */
export function useOpenAgentConversation(scope: Scope, agentId: AgentId) {
  const queryClient = useQueryClient()
  const { start, pending, failure } = useStartConversation('SAVED_AGENT')

  async function open(draft: boolean) {
    await start({ ...scope, agentId, draft }, undefined, () =>
      queryClient.invalidateQueries({
        queryKey: agentConversationsQuery(scope, agentId).queryKey,
      }),
    )
  }

  return {
    open,
    pending,
    error: failure === undefined ? undefined : writeFailureText(failure, UNCONFIRMED_CREATION),
  }
}
