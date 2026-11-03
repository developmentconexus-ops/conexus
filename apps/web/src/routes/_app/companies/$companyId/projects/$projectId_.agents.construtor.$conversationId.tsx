import { createFileRoute } from '@tanstack/react-router'
import {
  ConstrutorChat,
  conversationParams,
  loadConstrutorConversation,
} from '../../../../../builder/agents/public.ts'
import { ConversationGone } from '../../../../../builder/assistant/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'

// A conversation with the Construtor, at its Projeto's address; another person's or another Projeto's is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/construtor/$conversationId',
)({
  staticData: { place: 'Agentes' },
  params: {
    parse: (raw) => ({ ...projectParams.parse(raw), ...conversationParams.parse(raw) }),
    stringify: (p) => p,
  },
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
