import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { ASSISTANT_CONTROLLER, ConversationId } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { idOrNotFound, readOrNotFound } from '../../platform/hub.ts'
import { sessionReadQuery } from '../conversation/public.ts'
import { assistantConversationQuery } from './queries.ts'

/** The address's conversation id; a value the contract would never issue is not found. */
export const conversationParams = {
  parse: (raw: { conversationId: string }) => ({
    conversationId: idOrNotFound(ConversationId, raw.conversationId),
  }),
  stringify: (params: { conversationId: ConversationId }) => params,
}

/**
 * What a conversation with the Assistant needs before it draws: its read and its session's. A
 * conversation lives at one address, its Projeto's or the company's: at the other, it is not found.
 */
export async function loadAssistantConversation(
  queryClient: QueryClient,
  ids: { companyId: CompanyId; conversationId: ConversationId; projectId?: ProjectId },
) {
  const [read] = await readOrNotFound(
    Promise.all([
      queryClient.ensureQueryData(assistantConversationQuery(ids.companyId, ids.conversationId)),
      queryClient.ensureQueryData(sessionReadQuery(ids.conversationId, ASSISTANT_CONTROLLER)),
    ]),
  )
  if (read.conversation.projectId !== (ids.projectId ?? null)) throw notFound()
}
