import type { CompanyId } from '@conexus/hub-api'
import { ConversationId } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
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

/** What a conversation with the Assistant needs before it draws: its read and its session's. */
export function loadAssistantConversation(
  queryClient: QueryClient,
  ids: { companyId: CompanyId; conversationId: ConversationId },
) {
  return readOrNotFound(
    Promise.all([
      queryClient.ensureQueryData(assistantConversationQuery(ids.companyId, ids.conversationId)),
      queryClient.ensureQueryData(sessionReadQuery(ids.conversationId, 'assistant')),
    ]),
  )
}
