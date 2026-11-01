import { dayAndHour } from '../../platform/dates.ts'

/** The words of the Assistant's screens (step 24.1, U4); the founder approves them at the step's end. */
export const HOME_PLACEHOLDER = 'Pergunte, peça uma análise ou um documento…'
export const RECENT_TITLE = 'Conversas recentes'
export const NO_CONVERSATIONS = 'Nenhuma conversa neste Projeto ainda.'
export const NO_CHOICE = 'Nenhuma ligação escolhida'
export const NO_CONNECTIONS_HOME = 'Ligue um sistema em Integrações para perguntar sobre ele.'
export const NO_CONNECTIONS_PROJECT =
  'Este Projeto não recebeu nenhuma ligação. Libere uma em Integrações do Projeto.'
export const MEMBERS_CANNOT = 'Só o dono e os administradores conversam sobre o Projeto.'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_CHOICE =
  'Não confirmamos a troca das ligações. Confira a barra e tente de novo.'
export const FILE_EMPTY = 'Arquivo vazio.'

/** What a conversation is called until it is titled: the moment it was last written, the contract's only date. */
export function titleOf(conversation: { title: string | null; updatedAt: string }): string {
  return conversation.title ?? `Conversa de ${dayAndHour(conversation.updatedAt)}`
}

/** Início's examples: the chip's words, and what a tap puts in the box. */
export const ASSISTANT_EXAMPLES = [
  { label: 'Vendas da semana', text: 'Como foram as vendas da semana?' },
  { label: 'Processo de encomendas', text: 'Documente o processo de encomendas' },
  { label: 'Pagamento de contas', text: 'Como automatizo o pagamento de contas?' },
] as const
export const EMPTY_ASSISTANT = 'Pergunte, peça uma análise ou um documento.'
