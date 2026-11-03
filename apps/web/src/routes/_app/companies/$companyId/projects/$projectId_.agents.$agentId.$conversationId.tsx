import { createFileRoute } from '@tanstack/react-router'
import { AgentChat, loadAgentConversation } from '../../../../../builder/agents/public.ts'
import { ConversationGone } from '../../../../../builder/assistant/public.ts'
import { conversationParams } from '../../../../../builder/conversation/public.ts'

// A conversation with an agent, published or the test one with its draft, inside the agent's page.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/$agentId/$conversationId',
)({
  staticData: { place: 'Agentes' },
  params: conversationParams,
  loader: ({ context, params }) => loadAgentConversation(context.queryClient, params, params),
  notFoundComponent: ConversationGone,
  component: Chat,
})

function Chat() {
  const { companyId, projectId, agentId, conversationId } = Route.useParams()
  return (
    <AgentChat
      companyId={companyId}
      projectId={projectId}
      agentId={agentId}
      conversationId={conversationId}
    />
  )
}
