import type { SetLakeCopy } from '@conexus/hub-api'
import { LakeRun, LakeTablesOfConnection } from '@conexus/hub-api'
import type { Table } from './lake-pick.ts'

/** The lake of a connection with no tables to copy: what every other system answers. */
export const NO_LAKE = LakeTablesOfConnection.parse({
  lake: { kind: 'UNAVAILABLE', reason: 'NO_TABLES' },
  interval: null,
  startDate: null,
  tables: [],
  lastRun: null,
})

/** One table of the Sankhya's kit, not marked yet, with the name the Hub suggests. */
function declared(fields: Record<string, unknown> & { source: string; label: string }): Table {
  return LakeTablesOfConnection.shape.tables.element.parse({
    description: `O que guarda ${fields.label}.`,
    group: 'vendas',
    mode: { kind: 'CHANGED', column: 'DTALTER', registry: false },
    columns: 12,
    limited: true,
    copy: { kind: 'UNMARKED', suggested: `sankhya_${fields.source.toLowerCase()}` },
    ...fields,
  })
}

/** Four tables: two the date limits (a change column and a window), a register and a whole one. */
export const TABLES: Table[] = [
  declared({ source: 'TGFCAB', label: 'Notas e pedidos' }),
  declared({
    source: 'TGFITE',
    label: 'Itens das notas',
    mode: { kind: 'WINDOW', column: 'DTNEG' },
  }),
  declared({
    source: 'TGFPAR',
    label: 'Parceiros',
    mode: { kind: 'CHANGED', column: 'DTALTER', registry: true },
    limited: false,
  }),
  declared({
    source: 'TGFNFE',
    label: 'Dados da NF-e',
    group: 'financeiro',
    mode: { kind: 'FULL' },
    limited: false,
  }),
]

export const RUNNING_ROUND = LakeRun.parse({
  id: '00000000-0000-4000-8000-0000000000a1',
  startedAt: '2026-11-24T10:00:00.000Z',
  whole: false,
  outcome: 'RUNNING',
  stopping: false,
})

const COMPLETE_ROUND = LakeRun.parse({
  id: '00000000-0000-4000-8000-0000000000a2',
  startedAt: '2026-11-24T10:00:00.000Z',
  endedAt: '2026-11-24T10:05:00.000Z',
  whole: false,
  outcome: 'COMPLETE',
  read: 10,
  written: 10,
  machine: null,
})

/** A lake ready to take a copy, with the four tables unmarked. */
export function readyLake(fields: Partial<LakeTablesOfConnection> = {}): LakeTablesOfConnection {
  return LakeTablesOfConnection.parse({
    lake: { kind: 'READY' },
    interval: null,
    startDate: null,
    tables: TABLES,
    lastRun: null,
    ...fields,
  })
}

/** A lake that copies the named sources, each under its suggested name, last round complete. */
export function copiedLake(
  sources: readonly string[],
  fields: Partial<LakeTablesOfConnection> = {},
): LakeTablesOfConnection {
  return readyLake({
    interval: '24h',
    lastRun: COMPLETE_ROUND,
    tables: TABLES.map((table) =>
      sources.includes(table.source) && table.copy.kind === 'UNMARKED'
        ? {
            ...table,
            copy: {
              kind: 'MARKED',
              name: table.copy.suggested,
              lastRun: COMPLETE_ROUND,
              firstLoad: false,
            },
          }
        : table,
    ),
    ...fields,
  })
}

export type LakeView = { lake: LakeTablesOfConnection; linkAddress?: string }

export function stopOpenRound(view: LakeView): boolean {
  const round = view.lake.lastRun
  if (round?.outcome !== 'RUNNING') return false
  const lastRun = { ...round, stopping: true }
  view.lake = LakeTablesOfConnection.parse({ ...view.lake, lastRun })
  return true
}

/** What a PUT does to the lake the Hub holds: the marks, the interval and the date; a table added opens a round. */
export function applied(view: LakeView, body: SetLakeCopy): void {
  const names = new Map(body.tables.map((one) => [one.source, one.name]))
  const added = view.lake.tables.some(
    (one) => one.copy.kind === 'UNMARKED' && names.has(one.source),
  )
  const round = added ? RUNNING_ROUND : view.lake.lastRun
  view.lake = LakeTablesOfConnection.parse({
    ...view.lake,
    interval: body.interval,
    startDate: body.startDate,
    lastRun: round,
    tables: view.lake.tables.map((one) => {
      const name = names.get(one.source)
      if (name === undefined) {
        return {
          ...one,
          copy: { kind: 'UNMARKED', suggested: `sankhya_${one.source.toLowerCase()}` },
        }
      }
      return one.copy.kind === 'MARKED'
        ? one
        : { ...one, copy: { kind: 'MARKED', name, lastRun: null, firstLoad: true } }
    }),
  })
}
