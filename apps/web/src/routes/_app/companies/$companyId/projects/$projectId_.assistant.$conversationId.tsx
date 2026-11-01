import { ConversationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import {
  AssistantChat,
  assistantConversationQuery,
} from '../../../../../builder/assistant/public.ts'
import { sessionReadQuery } from '../../../../../builder/conversation/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

// A conversation with the Assistant born in a Projeto, at that Projeto's address; opened under
// another Projeto, or on the company's floor, it is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/assistant/$conversationId',
)({
  staticData: { place: 'Conversas' },
  params: {
    parse: (raw) => ({
      ...projectParams.parse(raw),
      conversationId: idOrNotFound(ConversationId, raw.conversationId),
    }),
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
  const { companyId, projectId, conversationId } = Route.useParams()
  return (
    <AssistantChat companyId={companyId} projectId={projectId} conversationId={conversationId} />
  )
}
