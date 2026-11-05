import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  createAssistantConversation,
  deleteAssistantConversation,
  listAssistantConnections,
  listAssistantConversations,
  readAssistantConversation,
  renameAssistantConversation,
  setAssistantConnections,
  setAssistantModel,
} from '@conexus/hub-api'
import type { QueryKey } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** The key of a list read with its title text taken out: same company, Projeto, place and page. */
function withoutText(key: QueryKey) {
  return JSON.stringify(key, (name, value: unknown) => (name === 'q' ? undefined : value))
}

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
  const read = hubQuery(listAssistantConversations, {
    params: { companyId },
    query: { projectId, page, ...narrowed },
  })
  const here = withoutText(read.queryKey)
  return {
    ...read,
    // A new text keeps the list on screen until its answer comes, not three skeletons per letter;
    // a new company, Projeto, place or page never shows the last one's list under the new name.
    placeholderData: <T>(
      previous: T | undefined,
      previousQuery: { queryKey: QueryKey } | undefined,
    ) =>
      previousQuery !== undefined && withoutText(previousQuery.queryKey) === here
        ? previous
        : undefined,
  }
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
