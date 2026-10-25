import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  createConversation,
  listConversations,
  readConversation,
  setConversationModel,
} from '@conexus/hub-api'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

export function conversationsQuery(
  companyId: CompanyId,
  projectId: ProjectId,
  page: string | undefined,
) {
  return hubQuery(listConversations, { params: { companyId, projectId }, query: { page } })
}
/** Every page of a Projeto's conversations. */
export function allConversationsQueryKey(companyId: CompanyId, projectId: ProjectId) {
  return hubQueryPrefix(listConversations, { companyId, projectId })
}
export function conversationQuery(
  companyId: CompanyId,
  projectId: ProjectId,
  conversationId: ConversationId,
) {
  return hubQuery(readConversation, { params: { companyId, projectId, conversationId } })
}

export const sendCreation = hubMutation(createConversation)
export const sendModel = hubMutation(setConversationModel)
