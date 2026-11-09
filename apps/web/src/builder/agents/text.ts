import type { AgentDetail, ProblemField, ProblemReason, ToolEffect } from '@conexus/hub-api'
import { agoOf, dayAndHour } from '../../platform/dates.ts'

/** The words of the Agentes screens (step 24.3, U5); the founder approves them at the step's end. */
export const AREA_TITLE = 'Agentes'
/** What a tool's operation is called in its form, by what the operation does to the system's data. */
export const OPERATION_LABEL: Record<ToolEffect, string> = { READ: 'Leitura', WRITE: 'Escrita' }
export const CONSTRUTOR_NAME = 'Construtor'
export const CONSTRUTOR_FIRST = 'Conte o que você quer que um agente faça.'
export const CONSTRUTOR_PLACEHOLDER = 'Peça ao Construtor…'
export const CONSTRUTOR_EXAMPLES = [
  { label: 'Um agente de vendas', text: 'Quero um agente de vendas' },
  {
    label: 'Conferir as metas',
    text: 'Quero um agente que confere as vendas de ontem com as metas',
  },
] as const
export const NO_AGENTS = 'Nenhum agente ainda.'
export const NO_AGENTS_COMPANY = 'Nenhum agente ainda. Os agentes nascem num Projeto.'
export const NO_AGENTS_IN_PROJECT = 'Nenhum agente neste Projeto.'
export const NEW_AGENT = 'Novo agente'
export const NEW_AGENT_WHERE = 'Em qual Projeto?'
export const NO_PROJECTS_FOR_AGENT = 'Crie um Projeto primeiro: os agentes nascem num Projeto.'
export const FILTER_PROJECT = 'Projeto'
export const ALL_PROJECTS = 'Todos os Projetos'
export const MORE_PROJECTS = 'Mais Projetos'

/** The last published turn of an agent, at a row's second line: "Rodou há 3 h", "Rodou ontem", "Rodou em 28/10". */
export function lastRunText(lastRunAt: string | null, now: Date): string {
  if (lastRunAt === null) return 'Nunca rodou'
  return `Rodou ${agoOf(lastRunAt, now)}`
}
export const NO_CONSTRUTOR_CONVERSATIONS = 'Nenhuma conversa com o Construtor ainda.'
export const MEMBERS_CANNOT =
  'Só o dono, os administradores e os desenvolvedores usam os agentes do Projeto.'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_SAVE = 'Não confirmamos a gravação. Confira o painel e tente de novo.'
export const UNCONFIRMED_PUBLISH =
  'Não confirmamos a publicação. Confira as versões e tente de novo.'
export const UNCONFIRMED_DELETE = 'Não confirmamos a exclusão. Confira a lista e tente de novo.'
export const AGENT_GONE = 'Este agente foi apagado.'
export const NO_AGENT_CONVERSATIONS = 'Ainda não há conversas com este agente.'
export const NO_VERSIONS = 'Ainda não publicado.'
export const NO_TOOLS = 'Nenhuma ferramenta da Conexus. As de cada ligação ficam em Ligações.'
export const CONEXUS_TOOLS = 'Do Conexus'
export const ADD_FROM_LIBRARY = 'Adicionar da biblioteca'

export const NO_CONNECTIONS = 'Este Projeto não recebeu nenhuma ligação.'
export const MARK_ALL_READS = 'Marcar todas as leituras'
/** The connector's free query: the one read that runs any SQL of the company's own, the only one that carries the warning. */
export const FREE_QUERY = 'consultar'
export const FREE_QUERY_WARNING = 'Consulta livre: roda qualquer SQL no banco inteiro'
export const OUT_OF_ROLE = 'Fora do seu papel'
/** The word on a write of a connection, beside its name (step 24.5). */
export const WRITES_WORD = 'escreve'
export const ASK_FIRST = 'Pergunta antes'
export const ON_ITS_OWN = 'Faz sozinho'
export const NO_UNATTENDED = 'Seu papel não publica escrita que faz sozinha'
/** The name of a write's key for a screen reader: when it runs. */
export function approvalKeyName(title: string): string {
  return `Quando ${title} roda`
}
export const GONE_CONNECTION = 'O Projeto não oferece mais'
export const DRAFT_CHANGED = 'O rascunho mudou. Abra o agente para ver.'
export const VERSIONS_TITLE = 'Versões'
export const ACTIVE_VERSION = 'Ativa'
export const DRAFT_PANEL = 'Rascunho do agente'
export const SAME_MODEL = 'O modelo de quem conversa'
/** The notice of a tool whose library has a version the draft does not hold. */
export function newVersionText(number: number): string {
  return `Versão ${number} disponível`
}
export const WEB_TOOL = 'Pesquisar na web'
/** The agent's own machine (step 24.4): commands, files and charts beside the conversation. */
export const COMPUTER_TOOL = 'Computador'
export const TEST_BANNER = 'Conversa de teste com o rascunho'

export function askAgent(name: string): string {
  return `Pergunte a ${name}…`
}

export function memoryText(memory: { observational: boolean }): string {
  return memory.observational ? 'observacional' : 'desligada'
}

export const DRAFT_STATE = 'Rascunho'
export const CHANGED_STATE = 'Rascunho com mudanças'

export function publishedText(version: number): string {
  return `Versão ${version} · publicada`
}

/** The whole sentence for each field a publication lacks, so each agrees with its own words. */
const MISSING: Partial<Record<ProblemField, string>> = {
  instructions: 'Faltam as instruções para publicar.',
  connections: 'Falta uma ligação que o Projeto ofereça para publicar.',
  model: 'Falta o modelo para publicar.',
}

export function missingField(field: ProblemField | undefined): string {
  return (field === undefined ? undefined : MISSING[field]) ?? 'Falta um campo para publicar.'
}

export function deleteWarning(name: string): string {
  return `Apagar ${name} apaga também as conversas de todas as pessoas com ele e as automações que o rodam. Se ele estiver respondendo agora, essa resposta é interrompida. Não dá para desfazer.`
}

const REASONS = {
  NOT_OFFERED: 'O Projeto não recebeu esta ligação.',
  NOT_A_READ: 'Só leituras entram nesta etapa.',
  VALUE_REFUSED: 'A operação não aceita este valor.',
  UNKNOWN_FIELD: 'A operação não tem este campo.',
  FIELD_TWICE:
    'Um campo aparece duas vezes: repetido nos que o modelo preenche, ou também nos valores fixos.',
  REQUIRED_MISSING: 'Falta um campo obrigatório da operação.',
  NOT_FIXED:
    'Esta operação pede um valor fixo de quem configura. Preencha-o nos valores fixos da ferramenta.',
  SLUG_TAKEN: 'Já existe uma ferramenta com este nome.',
  NOT_USABLE: 'O Projeto não pode usar esta ferramenta.',
  SAME_TOOL_TWICE: 'A mesma ferramenta não entra duas vezes.',
  CODE_BY_CONSTRUTOR: 'Uma ferramenta em código só o Construtor muda.',
  MODULE_STATE: 'O código guarda estado fora da função.',
  STALE_VERSION: 'Há uma versão mais nova desta ferramenta.',
} satisfies Record<ProblemReason, string>

/** The reason a refusal of a tool or of a choice names, in words. */
export function reasonText(reason: ProblemReason | undefined): string | undefined {
  return reason === undefined ? undefined : REASONS[reason]
}

/** When a conversation has no title yet, the moment it was last written, the contract's only date. */
export function titleOf(conversation: { title: string; updatedAt: string }): string {
  return conversation.title === ''
    ? `Conversa de ${dayAndHour(conversation.updatedAt)}`
    : conversation.title
}

/** The ready read of the kit a tool still is, when its description is the read's own; a tool made by hand, or in code, has none. */
function readOfTool(
  tool: { connectionId: string; operation?: string; description: string },
  offered: AgentDetail['offered'],
) {
  const read = offered
    .find((one) => one.connectionId === tool.connectionId)
    ?.reads.find((each) => each.operation === tool.operation)
  return read?.summary === tool.description ? read : undefined
}

/** The name a person reads for a tool: a ready read by the kit's own `label`; one made by hand by its description. */
export function toolTitle(
  tool: { connectionId: string; operation?: string; description: string },
  offered: AgentDetail['offered'],
): string {
  return readOfTool(tool, offered)?.label ?? tool.description
}

export function connectionOf(offered: AgentDetail['offered'], id: string) {
  return offered.find((one) => one.connectionId === id)
}
