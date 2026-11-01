import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  createAssistantConversation,
  listAssistantConnections,
  listAssistantConversations,
  readAssistantConversation,
  setAssistantConnections,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** The person's own conversations with the Assistant, newest first: all of them, or those of one Projeto. */
export function assistantConversationsQuery(
  companyId: CompanyId,
  projectId: ProjectId | undefined,
  page: string | undefined,
) {
  return hubQuery(listAssistantConversations, {
    params: { companyId },
    query: { projectId, page },
  })
}

export function assistantConversationQuery(companyId: CompanyId, conversationId: ConversationId) {
  return hubQuery(readAssistantConversation, { params: { companyId, conversationId } })
}

/** What a conversation not yet begun may choose: the connections the place offers. */
export function assistantConnectionsQuery(companyId: CompanyId, projectId: ProjectId | undefined) {
  return hubQuery(listAssistantConnections, { params: { companyId }, query: { projectId } })
}

export const sendAssistantCreation = hubMutation(createAssistantConversation)
export const sendAssistantConnections = hubMutation(setAssistantConnections)
