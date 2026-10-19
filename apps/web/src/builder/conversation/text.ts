import type { ConversationSummary } from '@conexus/hub-api'
import { dayAndHour } from '../../platform/dates.ts'

export const THINKING = 'Pensando…'
export const UNCONFIRMED_SEND = 'Não confirmamos o envio. Envie de novo.'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_MODEL =
  'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.'

/** What a conversation is called until the Builder titles it: the moment it began. */
export function titleOf(conversation: Pick<ConversationSummary, 'title' | 'createdAt'>): string {
  return conversation.title ?? `Conversa de ${dayAndHour(conversation.createdAt)}`
}
