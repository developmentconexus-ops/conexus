import { createFileRoute } from '@tanstack/react-router'
import {
  AssistantChat,
  conversationParams,
  loadAssistantConversation,
} from '../../../../../builder/assistant/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'

// A conversation with the Assistant born in a Projeto, at that Projeto's address; opened under
// another Projeto, or on the company's floor, it is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/assistant/$conversationId',
)({
  staticData: { place: 'Conversas' },
  params: {
    parse: (raw) => ({ ...projectParams.parse(raw), ...conversationParams.parse(raw) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) => loadAssistantConversation(context.queryClient, params),
  component: Chat,
})

function Chat() {
  const { companyId, projectId, conversationId } = Route.useParams()
  return (
    <AssistantChat companyId={companyId} projectId={projectId} conversationId={conversationId} />
  )
}
