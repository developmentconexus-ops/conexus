import { BUILDER_CONTROLLER, ConversationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import {
  conversationQuery,
  Panel,
  sessionReadQuery,
} from '../../../../../builder/conversation/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId/conversations/$conversationId',
)({
  staticData: { place: 'Projeto' },
  params: {
    parse: (raw) => ({ conversationId: idOrNotFound(ConversationId, raw.conversationId) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) =>
    readOrNotFound(
      Promise.all([
        context.queryClient.ensureQueryData(
          conversationQuery(params.companyId, params.projectId, params.conversationId),
        ),
        context.queryClient.ensureQueryData(
          sessionReadQuery(params.conversationId, BUILDER_CONTROLLER),
        ),
      ]),
    ),
  component: Panel,
})
