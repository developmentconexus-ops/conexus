import { createFileRoute } from '@tanstack/react-router'
import {
  AssistantChat,
  ConversationGone,
  conversationParams,
  loadAssistantConversation,
} from '../../../../../builder/assistant/public.ts'

// A conversation with the Assistant outside a Projeto, on the company's floor (web W29). One born in
// a Projeto lives at that Projeto's address: here it is not found.
export const Route = createFileRoute('/_app/companies/$companyId/conversations/$conversationId')({
  staticData: { place: 'Início', bounded: true },
  params: conversationParams,
  loader: ({ context, params }) => loadAssistantConversation(context.queryClient, params),
  notFoundComponent: ConversationGone,
  component: Chat,
})

function Chat() {
  const { companyId, conversationId } = Route.useParams()
  return <AssistantChat companyId={companyId} conversationId={conversationId} />
}
