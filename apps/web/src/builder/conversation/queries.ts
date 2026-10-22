import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  answerQuestion,
  createConversation,
  listConversations,
  readConversation,
  sendConversationMessage,
  setConversationModel,
  stopConversation,
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
export const sendMessage = hubMutation(sendConversationMessage)
export const sendStop = hubMutation(stopConversation)
export const sendModel = hubMutation(setConversationModel)
export const sendAnswer = hubMutation(answerQuestion)
