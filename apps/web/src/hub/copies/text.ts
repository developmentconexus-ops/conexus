import type {
  CopyInterval,
  CopyMode,
  CopyProposalSummary,
  CopyRun,
  CopySummary,
} from '@conexus/hub-api'
import { phraseOf } from '@conexus/hub-api'
import { dayAndHour, dayAndMonth } from '../../platform/dates.ts'
import { HubFailure, unconfirmedText, writeFailureText } from '../../platform/hub.ts'

/** The words of the Dados screens (Capacidade 2, U4); the founder approves them at the step's end. */
export const DATA_TITLE = 'Dados'
export const DATA_INTRO =
  'O que os agentes e os apps da empresa podem ler: cada tabela, de qual sistema veio, o que guarda e de quando é.'
export const RAW_INTRO = 'Cópia fiel de cada sistema. Atualiza sozinha no intervalo de cada tabela.'
export const SEARCH_TABLES = 'Buscar tabela ou coluna'
export const NO_SYSTEM = 'Nenhum sistema ligado ainda'
export const NO_SYSTEM_HINT =
  'Ligue um sistema da empresa, como o Sankhya, e as tabelas copiadas dele aparecem aqui.'
export const LINK_SYSTEM = 'Ligar um sistema'
export const NO_TABLE_COPIED = 'Nenhuma tabela copiada'
export const NO_MATCH = 'Nenhuma tabela com esse texto.'
export const NO_CONCEPT = 'Nenhum conceito aprovado ainda'
export const CONCEPT_HINT =
  'Um conceito é o significado de uma palavra do negócio, aprovado por uma pessoa da empresa, como "Venda". Quando o primeiro for aprovado, ele aparece aqui.'
export const CATALOG_FAILED =
  'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.'
export const WHOLE_PASS = 'Passada inteira'
export const TREE_LABEL = 'Dados'
export const PAUSED_LABEL = 'Pausada'
export const LOADING_LABEL = 'Carregando'
export const DATA_LAYERS = { raw: 'Bruto', business: 'Negócio', apps: 'Apps' } as const
export const DATA_COLUMNS = ['Tabela', 'Atualizada', 'Linhas', 'Intervalo', 'Projetos'] as const

/** A system's header in the list: its name, the connections' names (not one that repeats the system's) and how many tables it has copied. */
export function systemText(system: string, accounts: readonly string[], tables: number): string {
  const counted = tables === 0 ? [] : [`${tables} ${tables === 1 ? 'tabela' : 'tabelas'}`]
  const named = accounts.filter((account) => account !== system)
  return [system, named.join(', '), ...counted].filter((part) => part !== '').join(' · ')
}
export const ENABLE_COPY = 'Ligar uma cópia'
export const NO_MODEL_CONNECTION = 'Ligue em Integrações uma conexão que ofereça cópias.'
export const TO_INTEGRATIONS = 'Ir para Integrações'
export const NO_RUNS_YET = 'A primeira rodada ainda não terminou.'
export const APPS_INTRO =
  'As tabelas que cada app guarda. Elas são do Projeto e ficam aqui só para leitura.'
export const OPEN_PROJECT = 'Abrir o Projeto'
export const APPS_EMPTY = 'Nenhum app guarda tabelas ainda.'
export const MORE_PROJECTS = 'Mais Projetos'
export const APPS_COLUMNS = ['Tabela', 'Versão', 'Linhas'] as const

/** The version an app's tables belong to: the published one, or the one still being built. */
export function versionText(version: {
  publishedVersion: number | null
  appVersion: number
}): string {
  return version.publishedVersion !== null
    ? `Publicado · v${version.publishedVersion}`
    : `Em construção · v${version.appVersion}`
}
export const OVERVIEW_TITLE = 'Visão geral'
export const NO_DESCRIPTION = 'Sem descrição.'
export const ORIGIN_READ = 'Leitura de origem'
export const OVERVIEW_LABELS = { connection: 'Ligação', key: 'Chave', mode: 'Modo' } as const
export const CRUMBS_LABEL = 'Caminho'
export const COLUMNS_TITLE = 'Colunas'
export const SAMPLE_TITLE = 'Amostra'
export const KEY_MARK = 'Chave'
export const SEE_RUN = 'Ver a rodada'
export const SAMPLE_INTRO = 'Cinco linhas da cópia.'
export const SAMPLE_MORE = 'A cópia tem mais linhas que estas cinco.'
export const ROW_NUMBER = 'Linha'
export const SAMPLE_EMPTY = 'A cópia ainda não tem linhas.'
export const COLUMN_HEADS = ['Coluna', 'Tipo', 'O que guarda'] as const
export const DETAILS_TITLE = 'Detalhes'
export const PANEL_LABELS = {
  system: 'Sistema',
  frequency: 'Frequência',
  lastRun: 'Última rodada',
  rows: 'Linhas',
} as const
export const KEPT_IN_HUB =
  'Só os nomes e as descrições ficam no Hub. As linhas ficam na cópia, no banco da empresa.'

/** The line under a table's title: when the last pass copied it and how many rows, never an hour of a run that did not copy. */
export function copiedText(system: string, copy: Pick<CopySummary, 'run' | 'rows'>): string {
  if (copy.run === null) return `${system} · a primeira rodada ainda não terminou`
  if (copy.rows === null) return system
  const rows = ` · ${countText(copy.rows)} linhas`
  const { outcome, endedAt } = copy.run
  if (endedAt !== null && (outcome.kind === 'COMPLETE' || outcome.kind === 'PARTIAL')) {
    return `Copiada do ${system} em ${dayAndHour(endedAt)}${rows}`
  }
  return `${system}${rows}`
}

const TYPE_LABEL: Readonly<Record<string, string>> = {
  bigint: 'Número',
  numeric: 'Valor',
  text: 'Texto',
  date: 'Data',
  timestamp: 'Data e hora',
  boolean: 'Sim ou não',
  json: 'Estrutura',
}

/** A column's type in the company's words; a type the screen has no word for shows as the source named it. */
export function typeText(type: string): string {
  return TYPE_LABEL[type] ?? type
}

export function inactiveMark(since: string): string {
  return `Inativa desde ${dayAndMonth(since)}`
}

/** "A", "A e B", "A, B e C". */
function listed(names: readonly string[]): string {
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`
}

/** The notice on top of a table whose source stopped sending columns: nothing was erased. */
export function inactiveNotice(system: string, names: readonly string[], since: string): string {
  const day = dayAndMonth(since)
  if (names.length === 1) {
    return `O ${system} parou de enviar a coluna ${listed(names)} desde ${day}. Ela fica aqui, inativa, e nada foi apagado.`
  }
  return `O ${system} parou de enviar as colunas ${listed(names)} desde ${day}. Elas ficam aqui, inativas, e nada foi apagado.`
}
export const RUNS_TITLE = 'Rodadas'
export const RUN_REQUESTED = 'Pedido enviado. A rodada aparece na lista.'
export const NO_SCHEDULE = '—'
export const UNCONFIRMED_ACTION = unconfirmedText('a mudança', 'Veja a lista.')
export const UNCONFIRMED_ENABLE = unconfirmedText('a cópia', 'Toque de novo.')
export const PROPOSAL_WORD = 'Proposta'
export const PROPOSAL_GONE = 'Esta proposta não existe mais.'
export const PROPOSAL_STATE = { ACCEPTED: 'Ligada', DISMISSED: 'Dispensada' } as const
/**
 * What the dialog of Ligar a proposal says of a refusal: the table's words, except the two that
 * were written for other screens: `NOT_IN_ROLE` is about publishing a tool there, and `NOT_FOUND`
 * tells to check an address.
 */
export function enableFailureText(error: unknown): string {
  if (error instanceof HubFailure && !error.outcomeUnknown) {
    if (error.code === 'NOT_IN_ROLE') {
      const reading = error.operation?.replace(/\.+$/, '')
      const named = reading === undefined ? 'a leitura da conexão' : `a leitura ${reading}`
      return `Seu papel não pode usar ${named}, e quem liga uma cópia precisa poder ler o que ela copia. Peça a quem tem esse acesso para ligar.`
    }
    if (error.code === 'NOT_FOUND') return PROPOSAL_GONE
  }
  return writeFailureText(error, UNCONFIRMED_ENABLE)
}
export const MANAGERS_ENABLE =
  'Um dono, administrador ou desenvolvedor da empresa liga esta cópia na página Dados.'

/** The six intervals, each in its words once (the column, the detail and the dialog read these). */
export const INTERVAL_LABEL = {
  '15m': '15 min',
  '30m': '30 min',
  '1h': '1 h',
  '2h': '2 h',
  '6h': '6 h',
  '24h': '24 h',
} as const satisfies Record<CopyInterval, string>

export type CopyState = { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }

/** The state of a copy in words (design V35): the open run and the last, then the clock. */
export function stateOf(copy: Pick<CopySummary, 'run' | 'schedule'>): CopyState {
  const outcome = copy.run?.outcome.kind
  if (outcome === 'RUNNING') return { label: 'Rodando…', tone: 'warning' }
  if (copy.schedule.kind === 'PAUSED') return { label: PAUSED_LABEL, tone: 'neutral' }
  if (copy.schedule.kind === 'MISSING') return { label: 'Sem relógio', tone: 'neutral' }
  if (outcome === 'ERROR') return { label: 'Com erro', tone: 'danger' }
  if (outcome === 'COMPLETE') return { label: 'Em dia', tone: 'success' }
  return { label: 'Aguardando a próxima rodada', tone: 'neutral' }
}

type PartialReason = Extract<CopyRun['outcome'], { kind: 'PARTIAL' }>['reason']

function partialText(reason: PartialReason): string {
  switch (reason) {
    case 'CAP':
      return 'Parcial; a próxima continua'
    case 'WAIT':
      return 'Esperando o fornecedor; a próxima rodada continua de onde parou'
    case 'STOPPED':
      return 'O Conexus reiniciou no meio; a próxima continua de onde parou'
  }
}

/** How a run ended, in a sentence: a failure by its code's phrase (code C48), never "0 linhas". */
export function outcomeText(run: CopyRun): string {
  const { outcome } = run
  switch (outcome.kind) {
    case 'RUNNING':
      return 'Rodando…'
    case 'COMPLETE':
      return 'Completa'
    case 'PARTIAL':
      return partialText(outcome.reason)
    case 'INTERRUPTED':
      return 'O Conexus reiniciou no meio; a próxima continua de onde parou'
    case 'ERROR':
      return phraseOf(outcome.code)
  }
}

/** How often the copy runs, "A cada 30 min"; a copy with no clock has a dash. */
export function frequencyText(interval: CopyInterval | null): string {
  return interval === null ? NO_SCHEDULE : `A cada ${INTERVAL_LABEL[interval]}`
}

/** The last run as the panel says it: how it ended and when it ended, the same hour as the line under the title; an open run has no hour. */
export function lastRunText(run: CopyRun | null): string {
  if (run === null) return '—'
  return run.endedAt === null
    ? outcomeText(run)
    : `${outcomeText(run)} · ${dayAndHour(run.endedAt)}`
}

/** A count in the person's own notation, "118.402". */
export function countText(count: number): string {
  return count.toLocaleString('pt-BR')
}

/** How long a run took: "42 s", "2 min 5 s", "1 h 2 min"; a run that has not ended has no duration. */
export function durationText(run: Pick<CopyRun, 'startedAt' | 'endedAt'>): string {
  if (run.endedAt === null) return '—'
  const seconds = Math.max(
    0,
    Math.round((new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()) / 1000),
  )
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60)
    return seconds % 60 === 0 ? `${minutes} min` : `${minutes} min ${seconds % 60} s`
  return minutes % 60 === 0
    ? `${minutes / 60} h`
    : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

/** The copy's mode in words (Capacidade 3), from `copy.mode` as the Hub classified it; the screens never classify. */
export function modeText(mode: CopyMode): string {
  switch (mode.kind) {
    case 'WHOLE':
      return 'cópia inteira'
    case 'WINDOW':
      return `por janela de ${mode.days} dias`
    case 'CHANGES':
      return 'só o alterado'
  }
}

/** The page of proof in words: "teste: 50 linhas", "teste: mais de 50 linhas". */
export function provedText(proved: CopyProposalSummary['proved']): string {
  return `teste: ${proved.more ? 'mais de ' : ''}${countText(proved.rows)} linhas`
}

/** The calls a whole pass of a list read spends, as the proof answered: "cerca de 6 chamadas por passada". */
export function callsText(calls: number | null): string {
  if (calls === null) return 'a leitura não informa o total'
  return `cerca de ${countText(calls)} ${calls === 1 ? 'chamada' : 'chamadas'} por passada`
}

/** A list read's fixed input, each field and its value; "nenhum" when the copy reads it all. */
export function inputText(input: Readonly<Record<string, string | number | boolean>>): string {
  const fixed = Object.entries(input).map(([field, value]) => `${field}: ${String(value)}`)
  return fixed.length === 0 ? 'nenhum' : fixed.join(', ')
}

export const DELETE_RESTART = 'Se você ligar esta cópia de novo, ela copia tudo do zero.'
export const UNCONFIRMED_DELETE = unconfirmedText('o apagamento', 'Veja a lista.')

/** What Apagar takes from the company's database, said before the click: the copy's rows, or that their count is not known. */
export function deleteRowsText(rows: number | null): string {
  if (rows === null) return 'As linhas desta cópia saem do banco da empresa e não voltam.'
  if (rows === 1) return 'A 1 linha sai do banco da empresa e não volta.'
  return `As ${countText(rows)} linhas saem do banco da empresa e não voltam.`
}

export function deleteProjectText(project: string): string {
  return `O app do Projeto ${project} deixa de ler esta cópia. Onde ele a usava, vai mostrar erro.`
}

/** The table of a deleted copy that the company's database did not drop yet; the copy is gone all the same. */
export function deletedTableLeftText(name: string): string {
  return `A cópia foi apagada. A tabela ${name} ainda não saiu do banco da empresa; o Conexus a apaga no próximo Apagar, Desligar ou quando uma cópia for ligada.`
}
