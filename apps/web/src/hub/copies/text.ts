import type { LakeRun } from '@conexus/hub-api'

/** The words of the Dados screens (Capacidade 2, U4); the founder approves them at the step's end. */
export const DATA_TITLE = 'Dados'
export const DATA_INTRO =
  'O que os agentes e os apps da empresa podem ler: cada tabela, de qual sistema veio, o que guarda e de quando é.'
export const NO_SYSTEM = 'Nenhum sistema ligado ainda'
export const NO_SYSTEM_HINT =
  'Ligue um sistema da empresa, como o Sankhya, e as tabelas copiadas dele aparecem aqui.'
export const LINK_SYSTEM = 'Ligar um sistema'
export const NO_TABLE_COPIED = 'Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'
export const NO_TABLE_OF_ROLE =
  'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.'
export const NO_TABLE_OF_ROLE_SHORT = 'Seu papel ainda não lê nenhuma tabela.'
export const NO_CONCEPT = 'Nenhum conceito aprovado ainda'
export const CONCEPT_HINT =
  'Um conceito é o significado de uma palavra do negócio, aprovado por uma pessoa da empresa, como "Venda". Quando o primeiro for aprovado, ele aparece aqui.'
export const CATALOG_FAILED =
  'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.'
export const TREE_LABEL = 'Dados'
export const LOADING_LABEL = 'Carregando'
export const DATA_LAYERS = { raw: 'Bruto', business: 'Negócio', apps: 'Apps' } as const

/** A system's header in the list: its name, the connections' names (not one that repeats the system's) and how many tables it has. */
export function systemText(system: string, accounts: readonly string[], tables: number): string {
  const counted = tables === 0 ? [] : [`${tables} ${tables === 1 ? 'tabela' : 'tabelas'}`]
  const named = accounts.filter((account) => account !== system)
  return [system, named.join(', '), ...counted].filter((part) => part !== '').join(' · ')
}
/** A connection's header in the list: its name, where its tables live, how many there are and, when it is not working, its state. */
export function lakeGroupText(connection: string, tables: number, state: string | null): string {
  const counted = tables === 0 ? [] : [`${tables} ${tables === 1 ? 'tabela' : 'tabelas'}`]
  return [lakeOfText(connection), ...counted, ...(state === null ? [] : [state])].join(' · ')
}

/** What a table's page says it belongs to: the connection that copies it, in the lake. */
export function lakeOfText(connection: string): string {
  return `${connection} · Lago`
}
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

export const LAKE_LIST_COLUMNS = ['Tabela', 'Atualizada', 'Linhas', 'Intervalo'] as const
export const RUN_COLUMNS = ['Início', 'Tipo', 'Linhas lidas', 'Duração', 'Resultado'] as const
export const COLUMN_COLUMNS = ['Coluna', 'Tipo', 'Descrição'] as const
export const TABLE_TABS = {
  overview: 'Visão geral',
  columns: 'Colunas',
  runs: 'Rodadas',
  details: 'Detalhes',
} as const
export const RUN_COLUMNS_LABEL = 'Rodadas da tabela'
export const TABLE_COLUMNS = 'Colunas da tabela'
export const BACK_TO_DATA = 'Dados'
export const NOT_COPIED_ANYMORE = 'Esta tabela não é mais copiada.'
export const NEVER_RAN = 'Esta tabela ainda não rodou.'
export const RUNS_FAILED = 'Não deu para ler as rodadas agora. Tente de novo em instantes.'
export const INTERRUPTED = 'Interrompida.'
export const NO_VALUE = '—'
export const LAST_RUN = 'Última rodada'
export const LAKE_ROWS = 'Linhas no lago'
export const COLUMNS_FACT = 'Colunas'
export const NEXT_RUN = 'Próxima rodada'
export const INTERVAL_FACT = 'Intervalo'
export const LAKE_NAME_FACT = 'Nome no lago'
export const ORIGIN_FACT = 'Origem'
export const CONNECTION_FACT = 'Ligação'
export const MODE_FACT = 'Modo'
export const START_FACT = 'Data inicial'
export const HISTORY_FACT = 'Histórico'
export const NO_HISTORY = 'Só a versão de hoje'
export const MANUAL_NEXT = 'Só manual'
export const MACHINE = 'Máquina'
export const MACHINE_SIZE = 'Tamanho'
export const MACHINE_LENGTH = 'Duração'
export const MACHINE_MEMORY = 'Pico de memória'
export const MACHINE_CPU = 'Pico de CPU'
export const NO_MACHINE = 'Sem medida da máquina nesta rodada.'
type Ended = Exclude<LakeRun, { outcome: 'RUNNING' }>

/** What a round read, said by how it read; only a round that ended complete says "Completa". */
export function runKindText(run: Ended): string {
  if (run.outcome === 'COMPLETE')
    return run.whole ? 'Completa · inteira' : 'Completa · só o que mudou'
  return run.whole ? 'Inteira' : 'Só o que mudou'
}

/** Whether the system of the company answered in the failure: the answer of the Hub's or the AWS's own codes is not the system's to say. */
export function systemAnswered(code: Extract<LakeRun, { outcome: 'ERROR' }>['code']): boolean {
  return code.startsWith('COPY_SOURCE_')
}

export function columnsCountText(count: number): string {
  return count === 1 ? '1 coluna' : `${count} colunas`
}

export function stoppedAtText(table: string): string {
  return `Parou em ${table}.`
}

const NUMBER = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const ONE_DECIMAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const MIB_PER_GB = 1024

function percent(peak: number, allocated: number): number {
  return Math.round((peak / allocated) * 100)
}

type Machine = {
  allocated: { vcpu: number; memoryMib: number }
  peak: { vcpu: number; memoryMib: number }
}

/** The machine the round asked for: "1 vCPU · 2 GB". */
export function machineSizeText(machine: Machine): string {
  const gb = NUMBER.format(machine.allocated.memoryMib / MIB_PER_GB)
  return `${NUMBER.format(machine.allocated.vcpu)} vCPU · ${gb} GB`
}

/** The memory peak and its share of the machine's: "771 MB · 38% de 2 GB". */
export function memoryPeakText(machine: Machine): string {
  const { allocated, peak } = machine
  const share = percent(peak.memoryMib, allocated.memoryMib)
  const size = NUMBER.format(allocated.memoryMib / MIB_PER_GB)
  return `${NUMBER.format(peak.memoryMib)} MB · ${share}% de ${size} GB`
}

/** The CPU peak and its share of the machine's: "1,0 vCPU · 100%". */
export function cpuPeakText(machine: Machine): string {
  const { allocated, peak } = machine
  return `${ONE_DECIMAL.format(peak.vcpu)} vCPU · ${percent(peak.vcpu, allocated.vcpu)}%`
}

export function wholeRoundText(tables: number): string {
  return tables === 1
    ? 'Da rodada inteira, com a única tabela dela.'
    : `Da rodada inteira, com as ${tables} tabelas dela.`
}

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/** How long a round took: "38 s", "2 min 14 s", "41 min", "1 h 05 min". */
export function lengthText(startedAt: string, endedAt: string): string {
  const seconds = Math.max(0, Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000))
  if (seconds < SECONDS_PER_MINUTE) return `${seconds} s`
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const rest = seconds % SECONDS_PER_MINUTE
  if (minutes < MINUTES_PER_HOUR) return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const left = String(minutes % MINUTES_PER_HOUR).padStart(2, '0')
  return `${hours} h ${left} min`
}

export function lakeTablesNoteText(tables: number): string {
  return `${tables} ${tables === 1 ? 'tabela' : 'tabelas'} no lago`
}
