import type { CopyInterval, CopyRun, CopySummary } from '@conexus/hub-api'
import { phraseOf } from '@conexus/hub-api'
import { unconfirmedText } from '../../platform/hub.ts'

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

/** How a run ended, in a sentence: a failure by its code's phrase (code C48), never "0 linhas". */
export function outcomeText(run: CopyRun): string {
  const { outcome } = run
  switch (outcome.kind) {
    case 'RUNNING':
      return 'Rodando…'
    case 'COMPLETE':
      return 'Completa'
    case 'PARTIAL':
      return outcome.reason === 'CAP'
        ? 'Parcial; a próxima continua'
        : 'O Conexus reiniciou no meio; a próxima continua de onde parou'
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

/** What each run rereads, true to the engine: what changed since the last pass, the window, both, or the whole source. */
export function windowText(shown: Pick<CopySummary['shown'], 'changedSince' | 'window'>): string {
  const { changedSince, window } = shown
  const windowPart = window === null ? null : `${window.column} dos últimos ${window.days} dias`
  if (changedSince === null && windowPart === null) return 'A fonte inteira, a cada rodada.'
  const first = 'A primeira carga traz tudo; a cada rodada relê'
  if (windowPart === null) return `${first} o que mudou desde a anterior.`
  if (changedSince === null) return `${first} ${windowPart}.`
  return `${first} o que mudou desde a anterior e ${windowPart}.`
}
