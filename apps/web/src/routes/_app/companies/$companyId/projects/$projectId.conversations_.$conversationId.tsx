import { ConversationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { Conversation, conversationQuery } from '../../../../../builder/conversation/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId/conversations_/$conversationId',
)({
  staticData: { place: 'Conversa' },
  params: {
    parse: (raw) => ({ conversationId: idOrNotFound(ConversationId, raw.conversationId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(
        conversationQuery(params.companyId, params.projectId, params.conversationId),
      ),
    ),
  component: Conversation,
})
