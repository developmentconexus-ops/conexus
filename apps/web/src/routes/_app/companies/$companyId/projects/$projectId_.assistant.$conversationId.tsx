import { createFileRoute } from '@tanstack/react-router'
import {
  AssistantChat,
  ConversationGone,
  loadAssistantConversation,
} from '../../../../../builder/assistant/public.ts'
import { projectConversationParams } from '../../../../../builder/conversation/public.ts'

// A conversation with the Assistant born in a Projeto, at that Projeto's address; opened under
// another Projeto, or on the company's floor, it is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/assistant/$conversationId',
)({
  staticData: { place: 'Conversas' },
  params: projectConversationParams,
  loader: ({ context, params }) => loadAssistantConversation(context.queryClient, params),
  notFoundComponent: ConversationGone,
  component: Chat,
})

function Chat() {
  const { companyId, projectId, conversationId } = Route.useParams()
  return (
    <AssistantChat companyId={companyId} projectId={projectId} conversationId={conversationId} />
  )
}
