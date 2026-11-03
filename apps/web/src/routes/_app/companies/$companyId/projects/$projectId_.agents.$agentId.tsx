import { ConversationId } from '@conexus/hub-api'
import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'
import {
  AgentPage,
  AgentPending,
  AgentsReadFailure,
  agentParams,
  loadAgent,
} from '../../../../../builder/agents/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'

// An agent's page: its conversations, its configuration and, between them, the conversation the address opens (the child route).
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/$agentId',
)({
  staticData: { place: 'Agentes' },
  params: {
    parse: (raw) => ({ ...projectParams.parse(raw), ...agentParams.parse(raw) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) => loadAgent(context.queryClient, params, params.agentId),
  errorComponent: AgentsReadFailure,
  pendingComponent: AgentPending,
  component: Agent,
})

function Agent() {
  const { companyId, projectId, agentId } = Route.useParams()
  const conversationId = useParams({
    strict: false,
    select: (params) =>
      params.conversationId === undefined ? undefined : ConversationId.parse(params.conversationId),
  })
  return (
    <AgentPage
      key={agentId}
      companyId={companyId}
      projectId={projectId}
      agentId={agentId}
      conversationId={conversationId}
    >
      <Outlet />
    </AgentPage>
  )
}
