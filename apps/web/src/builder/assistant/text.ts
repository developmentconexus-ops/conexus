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
export const LINK_TOOLS_PROJECT = 'Liberar um sistema em Integrações do Projeto'
export const NO_PROJECT_CHIP = 'Conversa sem Projeto'
export const PROJECT_CHOICE = 'Projeto da conversa'
/** The name of a Projeto whose read failed. */
export const PROJECT_FALLBACK = 'Projeto'
export const PLUS_MENU = 'Anexar e ferramentas'
export const ATTACH_FILE = 'Anexar arquivo'
export const ATTACH_HINT = 'PDF, imagem, planilha'
export const TOOLS_LIST = 'Ferramentas da conversa'
export const TOOLS_SEARCH = 'Buscar ferramenta'
export const NO_TOOL_MATCH = 'Nenhuma ferramenta com esse nome.'
export const NO_TOOLS_COMPANY = 'Nenhuma ferramenta ligada à empresa'
export const LINK_ANOTHER_TOOL = 'Conectar outra ferramenta'
export const RELEASE_ANOTHER_TOOL = 'Liberar outra ferramenta ao Projeto'
export const NO_PROJECT_OPTION = 'Sem Projeto'
export const NO_PROJECT_MATCH = 'Nenhum Projeto com esse nome.'
export const MORE_PROJECTS = 'Mais Projetos'

export const CONTINUE_BLOCK = 'Continuar'
export const CONNECTIONS_BLOCK = 'Ligações'
export const INTEGRATIONS_LINK = 'Integrações →'
export const SEARCH_PROJECT = 'Buscar Projeto'
export const READING_TOOLS = 'Lendo as ferramentas…'
export const PROJECT_MENU_TITLE = 'Em qual Projeto?'

/** "ferramenta" or "ferramentas": the one plural of the word. */
export function toolWord(count: number): string {
  return count === 1 ? 'ferramenta' : 'ferramentas'
}

/** "1 ferramenta", "3 ferramentas". */
export function toolsOf(count: number): string {
  return `${count} ${toolWord(count)}`
}

/** "Mais 3 ligações". */
export function moreConnections(count: number): string {
  return `Mais ${count} ${count === 1 ? 'ligação' : 'ligações'}`
}

/** "2 de 3 ligadas". */
export function chosenOf(chosen: number, offered: number): string {
  return `${chosen} de ${offered} ligadas`
}
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

/** The words of the card of an app the Assistant proposed (step 24.3.2, U3); the founder approves them at the step's end. */
export const CREATE_APP = 'Criar app'
export const SEND_TO_BUILDER = 'Mandar ao Builder'
export const PROJECT_NAME_LABEL = 'Nome do projeto'
export const RELEASE_CONNECTIONS = 'Ligações para o app ler'
export const BRIEFING_LABEL = 'Briefing'
export const PROPOSAL_GONE = 'Esta proposta não existe mais.'
export const PROJECT_GONE = 'Este Projeto não existe mais.'
export const UNCONFIRMED_HANDOFF = 'Não confirmamos o envio ao Builder. Tente de novo.'
export const RETRY = 'Tentar de novo'
export const OPEN_BUILDER = 'Abrir a conversa do Builder'
