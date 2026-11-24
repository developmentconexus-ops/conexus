import { createFileRoute } from '@tanstack/react-router'
import {
  ConstrutorChat,
  loadConstrutorConversation,
} from '../../../../../agents/agent-builder/public.ts'
import { ConversationGone } from '../../../../../agents/assistant/public.ts'
import { projectConversationParams } from '../../../../../harness/room/public.ts'

// A conversation with the Construtor, at its Projeto's address; another person's or another Projeto's is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/construtor/$conversationId',
)({
  staticData: { place: 'Agentes' },
  params: projectConversationParams,
  loader: ({ context, params }) =>
    loadConstrutorConversation(context.queryClient, params, params.conversationId),
  notFoundComponent: ConversationGone,
  component: Chat,
})

function Chat() {
  const { companyId, projectId, conversationId } = Route.useParams()
  return (
    <ConstrutorChat companyId={companyId} projectId={projectId} conversationId={conversationId} />
  )
}
