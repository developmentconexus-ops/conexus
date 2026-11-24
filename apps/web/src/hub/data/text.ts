import type {
  AgentId,
  ConnectionId,
  DataReadAgent,
  DataReadEntry,
  DataReadResult,
} from '@conexus/hub-api'
import { resultOf } from '@conexus/hub-api'
import { clockOf, dayAndHour, dayGroupOf } from '../../platform/dates.ts'

/** Each agent of a read, as the filter and a row without the saved agent's name say it. */
export const AGENT_WORD: Record<DataReadAgent, string> = {
  ASSISTANT: 'Conexus em Conversas',
  BUILDER: 'Conexus em Construir',
  CONSTRUTOR: 'Conexus em Agentes',
  AGENT: 'Agentes',
  APP: 'App',
}

/** A saved agent the company no longer has (spec part 4, 9.3). */
const AGENT_GONE = 'Agente apagado'

/** The four words of a read's outcome (founder, P3 (a)). */
export const RESULT_WORD: Record<DataReadResult, string> = {
  READ: 'Lida',
  NOT_FOUND: 'Não encontrada',
  REFUSED: 'Recusada',
  NOT_READ: 'Não lida',
}

export function resultWord(outcome: string): string {
  return RESULT_WORD[resultOf(outcome)]
}

/** Where the read was asked (founder, P7 (a)): a Projeto deleted since has no name to give. */
export function placeOf(project: DataReadEntry['project']): string {
  if (project === null) return 'no Início'
  return project.name === null ? 'num Projeto apagado' : `no Projeto ${project.name}`
}

/** When, as a row and the open row's title say it: "hoje, 10:02", "ontem, 18:40" or the day. */
export function whenOf(at: string, now: Date): string {
  const group = dayGroupOf(at, now)
  if (group === 'TODAY') return `hoje, ${clockOf(at)}`
  if (group === 'YESTERDAY') return `ontem, ${clockOf(at)}`
  return dayAndHour(at)
}

/** A connection the company no longer has, in place of its name. */
const CONNECTION_GONE = 'Conexão apagada'

/** What a query that named no table read, in "O que foi lido". */
const A_QUERY = 'Consulta'

export const TEXT = {
  empty: 'Nenhuma leitura ainda.',
  emptyMore:
    'Cada leitura que um agente ou um app fizer do dado da empresa aparece aqui, sem o resultado.',
  emptyFiltered: 'Nenhuma leitura com esses filtros.',
  clear: 'Limpar os filtros',
  failed: 'Não deu para ler o registro agora.',
  notFound: 'Leitura não encontrada.',
  sheet: 'Ver as leituras',
  every: 'Todas',
  everyone: 'Todos',
  exportTitle: 'Exportar',
  exportAbout: 'As leituras dos filtros de agora, num arquivo CSV. No máximo 31 dias por vez.',
  exporting: 'Exportando…',
  from: 'De',
  to: 'Até',
  cut: 'As 5.000 leituras mais novas.',
  openConversation: 'Abrir a conversa',
} as const

/** The filters' menu on a phone, with how many are on. */
export function filtersLabel(on: number): string {
  return on === 0 ? 'Filtros' : `Filtros (${on})`
}

/** The names a row shows that the Registro keeps only as ids: the screen reads them from their owners. */
export type ReadNames = Readonly<{
  agent: (id: AgentId) => string | undefined
  connection: (id: ConnectionId) => string | undefined
}>

/** Which agent read: its word, or a saved agent's own name. */
export function agentOf(read: DataReadEntry, names: ReadNames): string {
  if (read.agent !== 'AGENT') return AGENT_WORD[read.agent]
  return (read.agentId === null ? undefined : names.agent(read.agentId)) ?? AGENT_GONE
}

/** What was read: the tables, a live read's connection and operation, or a query that named none. */
export function whatOf(read: DataReadEntry, names: ReadNames): string {
  if (read.verb === 'LIVE') {
    const named = read.connection === null ? undefined : names.connection(read.connection)
    return `${named ?? CONNECTION_GONE} · ${read.operation ?? ''}`
  }
  return read.tables.length > 0 ? read.tables.join(', ') : A_QUERY
}
