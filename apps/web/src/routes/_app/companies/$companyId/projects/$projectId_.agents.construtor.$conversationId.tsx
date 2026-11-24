import { createFileRoute, redirect } from '@tanstack/react-router'
import { projectConversationParams } from '../../../../../harness/room/public.ts'

// The address the Construtor's conversations had before the name of the code followed; old links and bookmarks reach the same conversation.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/construtor/$conversationId',
)({
  params: projectConversationParams,
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/companies/$companyId/projects/$projectId/agents/agent-builder/$conversationId',
      params,
      replace: true,
    })
  },
})
