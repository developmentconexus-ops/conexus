import { ConversationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import {
  AssistantChat,
  assistantConversationQuery,
} from '../../../../../builder/assistant/public.ts'
import { sessionReadQuery } from '../../../../../builder/conversation/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

// A conversation with the Assistant outside a Projeto, on the company's floor (web W29). One born in
// a Projeto lives at that Projeto's address: here it is not found.
export const Route = createFileRoute('/_app/companies/$companyId/conversations/$conversationId')({
  staticData: { place: 'Início' },
  params: {
    parse: (raw) => ({ conversationId: idOrNotFound(ConversationId, raw.conversationId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(
      Promise.all([
        context.queryClient.ensureQueryData(
          assistantConversationQuery(params.companyId, params.conversationId),
        ),
        context.queryClient.ensureQueryData(sessionReadQuery(params.conversationId, 'assistant')),
      ]),
    ),
  component: Chat,
})

function Chat() {
  const { companyId, conversationId } = Route.useParams()
  return <AssistantChat companyId={companyId} conversationId={conversationId} />
}
