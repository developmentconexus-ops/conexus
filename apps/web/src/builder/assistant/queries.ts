import type { CompanyId, CompanyMemoryPageId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  addCompanyMemoryNote,
  clearProfileMemory,
  createCompanyMemoryPage,
  deleteAssistantConversation,
  getProfileMemory,
  listAssistantConnections,
  listAssistantConversations,
  listCompanyMemory,
  readAssistantConversation,
  readCompanyMemoryPage,
  removeCompanyMemoryNote,
  removeCompanyMemoryPage,
  renameAssistantConversation,
  setAssistantConnections,
  setAssistantModel,
  setProfileMemory,
  writeCompanyMemoryInstructions,
  writeCompanyMemoryNote,
  writeCompanyMemoryPage,
} from '@conexus/hub-api'
import { hubMutation, hubQuery, keepWhileTextChanges } from '../../platform/hub.ts'

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
  return {
    ...read,
    placeholderData: keepWhileTextChanges(read.queryKey),
  }
}

export function assistantConversationQuery(companyId: CompanyId, conversationId: ConversationId) {
  return hubQuery(readAssistantConversation, { params: { companyId, conversationId } })
}

/** What a conversation not yet begun may choose: the connections the place offers. */
export function assistantConnectionsQuery(companyId: CompanyId, projectId: ProjectId | undefined) {
  return hubQuery(listAssistantConnections, { params: { companyId }, query: { projectId } })
}

export const sendAssistantConnections = hubMutation(setAssistantConnections)
export const sendAssistantModel = hubMutation(setAssistantModel)
export const sendAssistantDeletion = hubMutation(deleteAssistantConversation)
export const sendAssistantRename = hubMutation(renameAssistantConversation)

/** What the Assistant keeps about the person in the company, across their conversations. */
export function profileMemoryQuery(companyId: CompanyId) {
  return hubQuery(getProfileMemory, { params: { companyId } })
}

export const sendProfileMemory = hubMutation(setProfileMemory)
export const sendProfileMemoryClear = hubMutation(clearProfileMemory)

/** The company's instructions and pages, with whether the person may change them (U9). */
export function companyMemoryQuery(companyId: CompanyId) {
  return hubQuery(listCompanyMemory, { params: { companyId } })
}

export function companyMemoryPageQuery(companyId: CompanyId, pageId: CompanyMemoryPageId) {
  return hubQuery(readCompanyMemoryPage, { params: { companyId, pageId } })
}

export const sendCompanyInstructions = hubMutation(writeCompanyMemoryInstructions)
export const sendCompanyMemoryPage = hubMutation(writeCompanyMemoryPage)
export const sendCompanyMemoryPageRemoval = hubMutation(removeCompanyMemoryPage)
export const sendCompanyMemoryNote = hubMutation(writeCompanyMemoryNote)
export const sendCompanyMemoryNoteRemoval = hubMutation(removeCompanyMemoryNote)
export const sendCompanyMemoryPageCreation = hubMutation(createCompanyMemoryPage)
export const sendCompanyMemoryNoteAddition = hubMutation(addCompanyMemoryNote)
