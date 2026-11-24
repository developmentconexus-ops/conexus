import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import { CONSTRUTOR_CONTROLLER } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { sessionReadQuery } from '../../harness/room/public.ts'
import { readOrNotFound } from '../../platform/hub.ts'
import { construtorConversationsQuery } from './construtor-queries.ts'

/** A conversation with the Construtor: the person's own, in this Projeto. */
export async function loadConstrutorConversation(
  queryClient: QueryClient,
  scope: { companyId: CompanyId; projectId: ProjectId },
  conversationId: ConversationId,
) {
  const [listed] = await readOrNotFound(
    Promise.all([
      queryClient.query(construtorConversationsQuery(scope)),
      queryClient.ensureQueryData(sessionReadQuery(conversationId, CONSTRUTOR_CONTROLLER)),
    ]),
  )
  if (!listed.conversations.some((one) => one.id === conversationId)) throw notFound()
}
