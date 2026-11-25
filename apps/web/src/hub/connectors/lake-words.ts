import type { LakeInterval, LakeRun, LakeTablesOfConnection } from '@conexus/hub-api'
import { LAKE_INTERVALS } from '@conexus/hub-api'

const INTERVAL_LABELS = {
  '15m': '15 min',
  '30m': '30 min',
  '1h': '1 h',
  '2h': '2 h',
  '6h': '6 h',
  '24h': '24 h',
  MANUAL: 'Só manual',
} as const satisfies Record<LakeInterval, string>

export function intervalText(interval: LakeInterval): string {
  return INTERVAL_LABELS[interval]
}

/** The choices of the interval select, "Só manual" last. */
export const INTERVAL_ITEMS = LAKE_INTERVALS.map((value) => ({
  value,
  label: INTERVAL_LABELS[value],
}))

type Mode = LakeTablesOfConnection['tables'][number]['mode']

/** How a table is read, said as the card words it: "Só o que mudou, por DTALTER", "Janela por mês, por X" or "Inteira". */
export function modeText(mode: Mode): string {
  switch (mode.kind) {
    case 'CHANGED':
      return `Só o que mudou, por ${mode.column}`
    case 'WINDOW':
      return `Janela por mês, por ${mode.column}`
    case 'FULL':
      return 'Inteira'
  }
}

/** A day of the lake's `YYYY-MM-DD` as the person reads it: "24/11/2021". */
export function isoDayText(day: string): string {
  const [year, month, date] = day.split('-')
  return `${date}/${month}/${year}`
}

type Failed = Extract<LakeRun, { outcome: 'ERROR' }>['code']

const RUN_FAILURES = {
  COPY_LAKE_UNAVAILABLE: () => 'A AWS não iniciou a cópia. A próxima rodada tenta de novo.',
  COPY_TASK_LOST: () => 'A cópia parou antes de terminar. A próxima rodada tenta de novo.',
  COPY_LAKE_WRITE_FAILED: () => 'Não deu para gravar no lago. A próxima rodada tenta de novo.',
  COPY_SOURCE_NEEDS_REAUTH: (system) =>
    `${system} recusou o login da ligação. Reconecte a ligação.`,
  COPY_SOURCE_REFUSED: (system) => `${system} recusou a leitura.`,
  COPY_SOURCE_UNREACHABLE: (system) => `${system} não respondeu. A próxima rodada tenta de novo.`,
  COPY_SOURCE_UNREADABLE: (system) =>
    `${system} respondeu algo que o Conexus não entende. A próxima rodada tenta de novo.`,
} as const satisfies Record<Failed, (system: string) => string>

/** What a round that ended with an error says, by the code the Hub wrote on it. */
export function runFailureText(code: Failed, system: string): string {
  return RUN_FAILURES[code](system)
}
