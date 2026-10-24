import type { ConversationSummary } from '@conexus/hub-api'
import { dayAndHour } from '../../platform/dates.ts'

export const WORKING = 'Builder trabalhando'
export const STILL_WORKING = 'Ainda trabalhando…'
export const EMPTY_CONVERSATION = 'Descreva o aplicativo que você quer criar.'
export const UNCONFIRMED_SEND = 'Não confirmamos o envio. Envie de novo.'
export const STEER_PENDING = 'Vai ao Builder no próximo passo'
export const STEER_RETURNED = 'O Builder parou antes de ler sua mensagem. Ela voltou para o campo.'
export const STEER_PLACEHOLDER = 'Escreva para orientar o Builder'
export const STEER_KEYS = 'Enter orienta o Builder · Esc para'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_MODEL =
  'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.'

/** What a conversation is called until the Builder titles it: the moment it began. */
export function titleOf(conversation: Pick<ConversationSummary, 'title' | 'createdAt'>): string {
  return conversation.title ?? `Conversa de ${dayAndHour(conversation.createdAt)}`
}

/** A span of time said short: "12 s", "1 min 05 s", "1 h 02 min". */
export function durationOf(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  if (minutes === 0) return `${seconds} s`
  if (minutes < 60) return `${minutes} min ${rest} s`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}
