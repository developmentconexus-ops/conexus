import type {
  CopyInterval,
  CopyMode,
  CopyProposalSummary,
  CopyRun,
  CopySummary,
} from '@conexus/hub-api'
import { phraseOf } from '@conexus/hub-api'
import { HubFailure, unconfirmedText, writeFailureText } from '../../platform/hub.ts'

/** The words of the Cópias screens (Capacidade 2, U4); the founder approves them at the step's end. */
export const COPIES_TITLE = 'Cópias'
export const NO_COPIES =
  'Copie um dado de uma conexão para o banco da empresa e libere aos Projetos que usam.'
export const ENABLE_COPY = 'Ligar uma cópia'
export const NO_MODEL_CONNECTION = 'Ligue em Integrações uma conexão que ofereça cópias.'
export const TO_INTEGRATIONS = 'Ir para Integrações'
export const BACK_TO_COPIES = 'Cópias'
export const NO_RUNS_YET = 'A primeira rodada ainda não terminou.'
export const COPIED_TITLE = 'O que é copiado'
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
  'Um dono, administrador ou desenvolvedor da empresa liga esta cópia na página Cópias.'

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
  if (copy.schedule.kind === 'PAUSED') return { label: 'Pausada', tone: 'neutral' }
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

/** What each run rereads, as the mode says, with the window's column from `shown`. */
export function windowText(mode: CopyMode, shown: Pick<CopySummary['shown'], 'window'>): string {
  const first = 'A primeira carga traz tudo; a cada rodada relê o que mudou desde a anterior'
  switch (mode.kind) {
    case 'WHOLE':
      return 'A fonte inteira, a cada rodada.'
    case 'CHANGES':
      return `${first}.`
    case 'WINDOW':
      return `${first} e ${shown.window?.column ?? 'a janela'} dos últimos ${mode.days} dias.`
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
