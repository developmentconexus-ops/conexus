import type { ConversationId, ProjectId } from '@conexus/hub-api'
import { ConversationId as ConversationIdSchema } from '@conexus/hub-api'
import { projectParams } from '../../hub/projects/public.ts'
import { idOrNotFound } from '../../platform/hub.ts'

/** The conversation an address names; a value the contract would never issue is not found. */
export const conversationParams = {
  parse: (raw: { conversationId: string }) => ({
    conversationId: idOrNotFound(ConversationIdSchema, raw.conversationId),
  }),
  stringify: (params: { conversationId: ConversationId }) => params,
}

/** A conversation at its Projeto's address: the Projeto's params and the conversation's. */
export const projectConversationParams = {
  parse: (raw: { projectId: string; conversationId: string }) => ({
    ...projectParams.parse(raw),
    ...conversationParams.parse(raw),
  }),
  stringify: (params: { projectId: ProjectId; conversationId: ConversationId }) => params,
}
