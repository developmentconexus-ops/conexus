import { createFileRoute, redirect } from '@tanstack/react-router'
import { conversationsQuery, EmptyPanel } from '../../../../../builder/conversation/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// A Projeto opens on its latest conversation, read afresh; with none, the panel offers a new one.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId/')({
  staticData: { place: 'Projeto' },
  loader: async ({ context, params }) => {
    const { conversations } = await readOrNotFound(
      context.queryClient.fetchQuery(
        conversationsQuery(params.companyId, params.projectId, undefined),
      ),
    )
    const [latest] = conversations
    if (latest !== undefined) {
      throw redirect({
        to: '/companies/$companyId/projects/$projectId/conversations/$conversationId',
        params: { ...params, conversationId: latest.id },
        search: (previous) => previous,
        replace: true,
      })
    }
  },
  component: EmptyPanel,
})
