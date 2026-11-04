import type { AgentDetail, ProblemField, ProblemReason } from '@conexus/hub-api'
import { ageOf, dayAndHour } from '../../platform/dates.ts'

/** The words of the Agentes screens (step 24.3, U5); the founder approves them at the step's end. */
export const AREA_TITLE = 'Agentes'
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

/** The last published turn of an agent, at a row's second line. */
export function lastRunText(lastRunAt: string | null, now: Date): string {
  return lastRunAt === null ? 'Nunca rodou' : `Última execução: ${ageOf(lastRunAt, now)}`
}
export const NO_CONSTRUTOR_CONVERSATIONS = 'Nenhuma conversa com o Construtor ainda.'
export const MEMBERS_CANNOT = 'Só o dono e os administradores usam os agentes do Projeto.'
export const UNCONFIRMED_CREATION = 'Não confirmamos a criação da conversa. Tente de novo.'
export const UNCONFIRMED_SAVE = 'Não confirmamos a gravação. Confira o painel e tente de novo.'
export const UNCONFIRMED_PUBLISH =
  'Não confirmamos a publicação. Confira as versões e tente de novo.'
export const UNCONFIRMED_DELETE = 'Não confirmamos a exclusão. Confira a lista e tente de novo.'
export const AGENT_GONE = 'Este agente foi apagado.'
export const NO_AGENT_CONVERSATIONS = 'Ainda não há conversas com este agente.'
export const NO_VERSIONS = 'Ainda não publicado.'
export const NO_TOOLS = 'Nenhuma ferramenta. Peça ao Construtor, escolha ou crie aqui.'
export const NO_TOOL_MATCH = 'Nenhuma ferramenta com essas palavras.'
export const LIBRARY_TOOLS = 'Da biblioteca'
export const CONEXUS_TOOLS = 'Do Conexus'
export const ADD_FROM_LIBRARY = 'Adicionar da biblioteca'

/** The group of a connector's ready reads: "Sankhya · prontas do conector". */
export function readyGroup(connector: string): string {
  return `${connector} · prontas do conector`
}

/** What a tool does to the system it reads: the library only holds reads, so a new effect is a type error here until it has its words. */
const EFFECT_TEXT = { READ: 'lê' } as const

/** The second line of a tool: its connector and what it does; the connection only when the Projeto has more than one. */
export function toolFact(
  connector: string,
  connection: string | undefined,
  effect: keyof typeof EFFECT_TEXT,
): string {
  return [connector, connection, EFFECT_TEXT[effect]]
    .filter((part) => part !== undefined)
    .join(' · ')
}
export const NO_CONNECTIONS = 'Este Projeto não recebeu nenhuma ligação.'
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
  NOT_OFFERED: 'o Projeto não recebeu esta ligação',
  NOT_A_READ: 'só leituras entram nesta etapa',
  VALUE_REFUSED: 'a operação não aceita este valor',
  UNKNOWN_FIELD: 'a operação não tem este campo',
  FIELD_TWICE: 'o campo está nos valores fixos e nos abertos',
  REQUIRED_MISSING: 'falta um campo obrigatório da operação',
  SLUG_TAKEN: 'já existe uma ferramenta com este nome',
  NOT_USABLE: 'o Projeto não pode usar esta ferramenta',
  SAME_TOOL_TWICE: 'a mesma ferramenta não entra duas vezes',
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

/** The name a person reads for a tool: a ready read by the kit's own `label`; one made by hand by its description. */
export function toolTitle(
  tool: { connectionId: string; operation: string; description: string },
  offered: AgentDetail['offered'],
): string {
  const read = offered
    .find((one) => one.connectionId === tool.connectionId)
    ?.reads.find((each) => each.operation === tool.operation)
  return read?.summary === tool.description ? read.label : tool.description
}

export function connectionOf(offered: AgentDetail['offered'], id: string) {
  return offered.find((one) => one.connectionId === id)
}
