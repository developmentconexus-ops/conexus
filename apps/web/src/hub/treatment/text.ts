import type { ModelRunView, RunView, TableRef } from '@conexus/hub-api'
import { clockOf, dayAndHour, dayAndMonth } from '../../platform/dates.ts'

/** The words of the Tratado and Negócio screens; the founder approves them at the step's end. */
export const READ_FAILED =
  'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.'
export const NO_ACCESS = 'Seu papel ainda não lê nenhuma tabela. Peça a quem administra a empresa.'
export const OUTDATED_LAKE = 'Apague e crie o lago de novo na Central para tratar'
export const NO_TREATED =
  'Nenhuma tabela tratada. As tabelas de um sistema com molde aparecem aqui quando ele copia.'
export const NO_TREATMENT = 'Nenhum tratamento ainda'
const WAITING = 'Esperando a próxima cópia'
export const NOT_HERE_ANYMORE = 'Esta tabela não existe mais'
export const BACK_TO_DATA = 'Dados'
export const RUN_NOW = 'Tratar agora'
export const STOP = 'Parar'
export const STOPPING = 'Parando…'
export const STOP_TITLE = 'Parar a rodada de tratamento?'
export const STOP_LEAD =
  'As tabelas que a rodada já gravou ficam; as outras entram na próxima rodada, como as que falharam.'
export const CANCEL = 'Cancelar'
export const NEW_TREATMENT = 'Novo tratamento'
export const PROPOSE_CHANGE = 'Propor mudança'
export const APPROVE = 'Ligar'
export const PROPOSAL = 'Proposta, à espera do sim'
export const NAME_LABEL = 'Nome'
export const DESCRIPTION_LABEL = 'O que conta como esta tabela'
export const SQL_LABEL = 'SQL'
export const SAVE = 'Salvar'
export const SAVING = 'Salvando…'
export const NAME_INVALID = 'Use letras minúsculas, números e _, começando por uma letra.'
export const SQL_REQUIRED = 'Escreva o SELECT do tratamento.'
export const APPROVING = 'Ligando…'
export const APPROVE_EFFECT =
  'A rodada seguinte passa a gravar esta tabela com este SQL. Nada roda agora.'
export const PROPOSAL_CHANGED = 'A proposta mudou enquanto você lia. Esta é a nova.'
export const READS = 'Tabelas que o SQL lê'
export const NOTHING_READ = 'Nenhuma'
export const NO_READER = 'Nenhuma tabela lê esta ainda.'
const NOT_RUN = 'Não rodou na última rodada'
export const UNCONFIRMED_NEXT = 'Veja a lista de tratamentos antes de salvar de novo.'
export const UNCONFIRMED_WHAT = 'a proposta'
export const TABS = {
  overview: 'Visão geral',
  columns: 'Colunas',
  sql: 'SQL',
  from: 'De onde vem',
  readBy: 'Quem lê',
  versions: 'Versões',
} as const
export const COLUMN_COLUMNS = ['Coluna', 'Tipo', 'Descrição'] as const
export const COLUMNS_LABEL = 'Colunas da tabela'
const LAYER_NAMES = { current: 'Copiado', tratado: 'Tratado', negocio: 'Negócio' } as const
export const LAST_RUN = 'Última rodada'
export const ACTIVE = 'Ligada'
export const NO_ACTIVE = 'Nenhuma versão ligada'
const RUN_FAILED = 'A última rodada falhou'
const RUN_NOT_ENDED = 'A última rodada não terminou'

/** What a failure code says: the code of a run, or the Athena's own type for a model; one owner for both (code C26). */
const REASONS: Readonly<Record<string, string>> = {
  TREAT_START_FAILED: 'a rodada não conseguiu começar',
  TREAT_TASK_STOPPED: 'a rodada parou antes de terminar',
  TREAT_SPEC_INVALID: 'o pedido da rodada não passou na conferência',
  TREAT_ENGINE_FAILED: 'o motor de tratamento falhou',
  COLUMN_NOT_FOUND: 'coluna que não existe',
}

function reasonText(code: string, line: number | null = null): string {
  const reason = REASONS[code] ?? `O Athena recusou o SQL (${code})`
  return line === null ? reason : `${reason}, na linha ${line}`
}

function failedText(code: string, line: number | null): string {
  return `${RUN_FAILED}: ${reasonText(code, line)}`
}

function rowsText(rows: number, at: string): string {
  return `${rows.toLocaleString('pt-BR')} linhas · tratada às ${clockOf(at)}`
}

/** A stopped run whose stopper is not known: no name is made up. */
const STOPPED = 'Parada.'

function stoppedByText(name: string, at: string): string {
  return `Parada por ${name} às ${clockOf(at)}`
}

export function proposalLine(number: number): string {
  return `Proposta: v${number}, à espera do sim`
}

export function activeLine(version: {
  number: number
  approvedBy: string | null
  approvedAt: string | null
}): string {
  const by = version.approvedBy === null ? '' : ` · ligada por ${version.approvedBy}`
  const at = version.approvedAt === null ? '' : ` em ${dayAndMonth(version.approvedAt)}`
  return `${ACTIVE}: v${version.number}${by}${at}`
}

export function versionLine(version: {
  proposedBy: string
  proposedAt: string
  approvedBy: string | null
  approvedAt: string | null
}): string {
  const proposed = `proposta por ${version.proposedBy} em ${dayAndHour(version.proposedAt)}`
  if (version.approvedBy === null || version.approvedAt === null) return proposed
  return `${proposed}, ligada por ${version.approvedBy} em ${dayAndHour(version.approvedAt)}`
}

/** A table the SQL reads by its place: a treated table shows its label when the list gives it. */
export function refText(ref: TableRef, label: string | null = null): string {
  return `${LAYER_NAMES[ref.layer]} › ${ref.layer === 'tratado' ? (label ?? ref.table) : ref.table}`
}

/** The line a table shows under its name: its rows and hour, why the last round did not build it, or that it waits. */
export function runText(run: ModelRunView | null): string {
  if (run === null) return WAITING
  switch (run.status) {
    case 'BUILT':
      return rowsText(run.rows, run.at)
    case 'FAILED':
      return failedText(run.failure, run.line)
    case 'SKIPPED':
      return NOT_RUN
    default:
      return run satisfies never
  }
}

/** The line at the top of Tratado for a run that did not end well; null for one open or done. */
export function runTopText(run: RunView | null): string | null {
  if (run === null) return null
  switch (run.state) {
    case 'STARTING':
    case 'RUNNING':
    case 'DONE':
      return null
    case 'FAILED':
      return `${RUN_NOT_ENDED}: ${reasonText(run.failure)}`
    case 'STOPPED':
      return run.stoppedBy === null ? STOPPED : stoppedByText(run.stoppedBy.name, run.at)
    default:
      return run satisfies never
  }
}
