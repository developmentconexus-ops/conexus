import type { ConversationId } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import type { Controller } from './session.ts'
import { sessionOf } from './session.ts'

/**
 * Renomear for a list of one agent's conversations: the title goes to the conversation's session on
 * Mastra's own route, the same for every agent, and the person's lists read again afterwards.
 */
export function useRenameConversation(controller: Controller) {
  const rename = useMutation({
    mutationKey: ['renameConversation', controller],
    mutationFn: (input: { conversationId: ConversationId; title: string }) =>
      sessionOf(input.conversationId, controller).rename(input.title),
  })
  return (conversationId: ConversationId) => async (title: string) => {
    await rename.mutateAsync({ conversationId, title })
  }
}
