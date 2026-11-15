import type { AgentId, CompanyId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { writeFailureText } from '../../platform/hub.ts'
import { UNCONFIRMED_CREATION } from '../conversation/public.ts'
import { agentConversationsQuery, sendAgentConversation } from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/**
 * Opens a new conversation of the person's with the agent, with its published version or, with
 * `draft`, the test one with its draft, and goes to it; a refusal is the sentence `error` holds.
 */
export function useOpenAgentConversation(scope: Scope, agentId: AgentId) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const create = useMutation(sendAgentConversation)
  const attempt = useAttemptKey()
  const [error, setError] = useState<string>()

  async function open(draft: boolean) {
    setError(undefined)
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params: { ...scope, agentId }, body: { draft }, attemptKey }),
      )
      await queryClient.invalidateQueries({
        queryKey: agentConversationsQuery(scope, agentId).queryKey,
      })
      await navigate({
        to: '/companies/$companyId/projects/$projectId/agents/$agentId/$conversationId',
        params: { ...scope, agentId, conversationId: conversation.id },
      })
    } catch (failure) {
      setError(writeFailureText(failure, UNCONFIRMED_CREATION))
    }
  }

  return { open, pending: create.isPending, error }
}
