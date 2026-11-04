import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  createAssistantConversation,
  deleteAssistantConversation,
  handAssistantProposal,
  listAssistantConnections,
  listAssistantConversations,
  readAssistantConversation,
  renameAssistantConversation,
  setAssistantConnections,
  setAssistantModel,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/**
 * The person's own conversations with the Assistant, newest first: all of them, or those of one
 * Projeto, one place or a title text (`narrowed`).
 */
export function assistantConversationsQuery(
  companyId: CompanyId,
  projectId: ProjectId | undefined,
  page: string | undefined,
  narrowed: { q?: string | undefined; place?: 'HOME' | 'AUTOMATIONS' | undefined } = {},
) {
  return hubQuery(listAssistantConversations, {
    params: { companyId },
    query: { projectId, page, ...narrowed },
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
export const sendAssistantModel = hubMutation(setAssistantModel)
export const sendAssistantDeletion = hubMutation(deleteAssistantConversation)
export const sendAssistantRename = hubMutation(renameAssistantConversation)
export const sendAssistantHandOff = hubMutation(handAssistantProposal)
