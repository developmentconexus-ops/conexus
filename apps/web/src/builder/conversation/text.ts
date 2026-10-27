import type { ConversationSummary } from '@conexus/hub-api'
import { dayAndHour } from '../../platform/dates.ts'
import type { DictationError } from '../../ui/speech-input.tsx'
import type { Refusal } from './attachments.ts'
import { LIMITS } from './attachments.ts'

export const WORKING = 'Builder trabalhando'
export const STILL_WORKING = 'Ainda trabalhando…'
export const EMPTY_CONVERSATION = 'Descreva o aplicativo que você quer criar.'
export const UNCONFIRMED_SEND = 'Não confirmamos o envio. Envie de novo.'
export const STEER_PENDING = 'Vai ao Builder no próximo passo'
export const STEER_PLACEHOLDER = 'Escreva para orientar o Builder'
/** Where a person may put a secret by habit: said under the field on a computer, and on a phone in the first-time state and the model sheet. */
export const NO_SECRETS = 'Não cole senhas ou chaves na conversa.'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_MODEL =
  'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.'

/** Megabytes of file the route takes for a data URL's characters: base64 spends 4 for every 3 bytes. */
function megabytesOf(characters: number): string {
  return new Intl.NumberFormat('pt-BR').format((characters * 3) / 4 / 1024 / 1024)
}

/** Why the composer left a file out, said with the ceiling the hook applies. */
export const REFUSALS: Record<Refusal, string> = {
  'too-many': `Até ${LIMITS.files} arquivos por mensagem.`,
  'too-large': `Este arquivo passa de ${megabytesOf(LIMITS.data)} MB.`,
  'too-large-together': `Os arquivos passam de ${megabytesOf(LIMITS.total)} MB juntos.`,
  type: 'Este tipo de arquivo não é aceito.',
  unread: 'Não conseguimos ler este arquivo. Escolha de novo.',
}

const DICTATION_STOPPED = 'O ditado parou. Tente de novo.'
/** Why the microphone stopped, said by the code the browser gave (`aborted` is the person's own stop and says nothing). */
export function dictationText(error: DictationError): string {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Permita o microfone no navegador para ditar.'
    case 'language-not-supported':
      return 'Este navegador não dita em português.'
    case 'no-speech':
      return 'Não ouvimos nada. Tente de novo.'
    default:
      return DICTATION_STOPPED
  }
}

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
