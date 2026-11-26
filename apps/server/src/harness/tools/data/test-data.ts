import type { CompanyData, DataSources } from '@conexus/hub-api'
import { Catalog, companyData } from '@conexus/hub-api'
import { PADARIA_SOL_MATRIZ, soldBy } from '../../../hub/connectors/test-sales.ts'

const MATRIZ = '00000000-0000-4000-8000-0000000000c1'

/** The October total the Sankhya double's sellers sold. */
export const TOTAL_OUTUBRO =
  Math.round(
    [...soldBy(PADARIA_SOL_MATRIZ, '2026-10').values()].reduce((sum, each) => sum + each, 0) * 100,
  ) / 100

const CATALOG = Catalog.parse({
  kind: 'CATALOG',
  systems: [
    {
      connection: MATRIZ,
      connector: 'sankhya',
      name: 'Matriz',
      reads: [{ operation: 'consultar', label: 'Consultas', summary: 'Consulta o Sankhya.' }],
      actions: [],
    },
  ],
})

const SOURCES: DataSources = {
  async catalog() {
    return CATALOG
  },
  async live() {
    return { kind: 'NOT_GRANTED' }
  },
  async funnel() {
    return { kind: 'NOT_GRANTED' }
  },
}

/** The Padaria Sol's data as a recording meets it: invented, the Matriz's Sankhya connection and no table kept (security S40). */
export function recordedData(): CompanyData {
  return companyData({ sources: SOURCES, now: () => new Date('2026-11-14T12:00:00.000Z') })
}
