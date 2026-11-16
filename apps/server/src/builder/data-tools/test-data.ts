import type { CompanyData, DataSources } from '@conexus/hub-api'
import { Catalog, companyData } from '@conexus/hub-api'
import {
  changedOn,
  PADARIA_SOL_MATRIZ,
  sankhyaCopyModels,
  soldBy,
} from '../../hub/connectors/test-sales.ts'

const MATRIZ = '00000000-0000-4000-8000-0000000000c1'
const CONNECTION = { id: MATRIZ, name: 'Matriz', connector: 'sankhya' }
const ENDED = '2026-11-14T11:45:00.000Z'
const NOTES_SHOWN = 6

/** The October total the recorded query answers: what the double's sellers sold, summed. */
export const TOTAL_OUTUBRO =
  Math.round(
    [...soldBy(PADARIA_SOL_MATRIZ, '2026-10').values()].reduce((sum, each) => sum + each, 0) * 100,
  ) / 100

export const OCTOBER_SQL =
  'select sum("VLRNOTA") as total from sync.vendas where "DTNEG" >= \'2026-10-01\' and "DTNEG" < \'2026-11-01\''

const RUN = {
  id: '00000000-0000-4000-8000-0000000000d1',
  startedAt: '2026-11-14T11:40:00.000Z',
  endedAt: ENDED,
  read: 183,
  written: 183,
  whole: false,
  outcome: { kind: 'COMPLETE' },
}

const CATALOG = Catalog.parse({
  kind: 'CATALOG',
  systems: [
    {
      connection: MATRIZ,
      connector: 'sankhya',
      name: 'Matriz',
      liveOnly: false,
      reads: [{ operation: 'consultar', label: 'Consultas', summary: 'Consulta o Sankhya.' }],
      actions: [],
    },
  ],
  tables: sankhyaCopyModels().map((model) => ({
    name: model.id,
    label: model.label,
    description: model.definition.description,
    columns: model.definition.columns.map(({ name, type, description }) => ({
      name,
      type,
      description,
      inactiveSince: null,
    })),
    kept: {
      kind: 'COPY',
      sources: [{ kind: 'NAMED', connection: CONNECTION, state: 'ACTIVE' }],
      source: { kind: 'QUERY', query: model.definition.source.sql },
      lastRun: RUN,
    },
  })),
})

const NOTES = PADARIA_SOL_MATRIZ.notas
  .filter((nota) => nota.dtneg.startsWith('2026-10'))
  .slice(0, NOTES_SHOWN)
  .map((nota) => ({
    NUNOTA: nota.nunota,
    NUMNOTA: nota.nunota % 100_000,
    CODEMP: nota.codemp,
    CODTIPOPER: 3200,
    TIPMOV: 'V',
    DTNEG: nota.dtneg,
    CODPARC: nota.codparc,
    CODVEND: nota.codvend,
    VLRNOTA: Math.round(nota.itens.reduce((sum, item) => sum + item.vlrtot, 0) * 100) / 100,
    STATUSNOTA: 'L',
    DTALTER: `${nota.dtneg} ${changedOn(nota.dtneg).slice(11)}`,
  }))

const SOURCES: DataSources = {
  async catalog() {
    return CATALOG
  },
  async rows() {
    return { kind: 'ROWS', rows: NOTES, complete: false }
  },
  async live() {
    return { kind: 'NOT_GRANTED' }
  },
  async query() {
    return {
      kind: 'ROWS',
      columns: ['total'],
      rows: [[TOTAL_OUTUBRO]],
      complete: true,
      used: ['vendas'],
    }
  },
  async funnel() {
    return { kind: 'NOT_GRANTED' }
  },
}

/** The Padaria Sol's copied data as a recording meets it: invented, the Matriz's five Sankhya copies, last run complete on 14 November (security S40). */
export function recordedData(): CompanyData {
  return companyData({ sources: SOURCES, now: () => new Date('2026-11-14T12:00:00.000Z') })
}
