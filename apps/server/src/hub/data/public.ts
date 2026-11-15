import type { CompanyData } from '@conexus/hub-api'
import { companyData } from '@conexus/hub-api'
import type { SessionScope } from '../connectors/public.ts'
import { catalogOf } from './catalog.ts'
import type { DataDeps } from './deps.ts'
import { rowsOf } from './rows.ts'

export type { DataDeps } from './deps.ts'

/** The access contract bound to who asks and where (`SessionScope` of hub/connectors/public.ts). */
export function createCompanyData(deps: DataDeps): (scope: SessionScope) => CompanyData {
  return (scope) =>
    companyData({
      sources: {
        catalog: () => catalogOf(deps, scope),
        rows: ({ table, signal }) => rowsOf(deps, scope, { table, signal }),
        live: async () => ({ kind: 'NOT_GRANTED' }),
        query: async () => ({ kind: 'TABLE_UNAVAILABLE' }),
        funnel: async () => ({ kind: 'NOT_GRANTED' }),
      },
      now: () => new Date(),
    })
}
