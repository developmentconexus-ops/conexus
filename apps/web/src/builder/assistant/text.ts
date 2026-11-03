import { dayAndHour } from '../../platform/dates.ts'

/** The words of the Assistant's screens (step 24.1, U4); the founder approves them at the step's end. */
export const HOME_PLACEHOLDER = 'Pergunte, peça uma análise ou um documento…'
export const NEW_CONVERSATION = 'Nova conversa'
export const DAY_GROUP_LABELS = {
  TODAY: 'Hoje',
  YESTERDAY: 'Ontem',
  WEEK: 'Esta semana',
  BEFORE: 'Antes',
} as const
/** A Projeto's list has the page's title "Conversas" for its heading, so the list only names its landmark. */
export const PROJECT_LIST_TITLE = 'Conversas'
export const NO_CONVERSATIONS = 'Nenhuma conversa neste Projeto ainda.'
export const NO_CONVERSATIONS_BLOCK = 'Nenhuma conversa ainda.'
export const NO_CONNECTIONS_BLOCK = 'Ligue um sistema em Integrações.'
/** The composer's tools button when nothing is on, or nothing is offered. */
export const NO_TOOLS = 'Sem ferramentas'
export const LINK_TOOLS_HOME = 'Ligar um sistema em Integrações'
export const LINK_TOOLS_PROJECT = 'Liberar um sistema em Integrações do Projeto'
export const NO_PROJECT_CHIP = 'Conversa sem Projeto'
export const PROJECT_CHOICE = 'Projeto da conversa'
export const TOOLS_LIST = 'Ligações desta conversa'
export const MEMBERS_CANNOT = 'Só o dono e os administradores conversam sobre o Projeto.'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_CHOICE =
  'Não confirmamos a troca das ferramentas. Confira a caixa e tente de novo.'
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
export const CONVERSATION_GONE = 'Esta conversa não existe mais.'
