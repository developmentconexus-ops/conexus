import { listConversations } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { Conversations, conversationsQuery } from '../../../../../builder/conversation/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId/conversations',
)({
  staticData: { place: 'Conversa' },
  validateSearch: listConversations.input.query.catch({}),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(
        conversationsQuery(params.companyId, params.projectId, deps.page),
      ),
    ),
  component: Conversations,
})
