import type { CompanyId, ConversationId, ProjectId } from '@conexus/hub-api'
import {
  createConversation,
  Effort,
  listConversations,
  ModelId,
  readConversation,
  setConversationModel,
  Task,
} from '@conexus/hub-api'
import { z } from 'zod'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'
import type { Controller } from './session.ts'
import { sessionOf } from './session.ts'

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

/** What the screen takes of Mastra's session state: the conversation's model, effort and tasks. */
export const SessionRead = z.object({ model: ModelId, effort: Effort, tasks: z.array(Task) })
export type SessionRead = z.infer<typeof SessionRead>

export function sessionReadQuery(conversationId: ConversationId, controller: Controller) {
  return {
    queryKey: ['builder', 'session-state', controller, conversationId] as const,
    queryFn: async () => {
      const state = await sessionOf(conversationId, controller).state()
      return SessionRead.parse({
        model: state.modelId,
        effort: state.settings?.thinkingLevel ?? 'off',
        tasks: state.tasks,
      })
    },
  }
}

export const sendCreation = hubMutation(createConversation)
export const sendModel = hubMutation(setConversationModel)
