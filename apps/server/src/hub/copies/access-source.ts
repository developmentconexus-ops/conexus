import type { AccessSources } from '../access/public.ts'
import { catalogTables } from './catalog-view.ts'
import { copiesReadBy } from './readers.ts'
import type { CopiesDeps } from './store.ts'

/** The copies a place reads: in a Projeto those released to it, in the company those the role reads. */
export function accessTables(deps: Pick<CopiesDeps, 'identity'>): AccessSources['tables'] {
  return async (tx, { companyId, place, role, given }) => {
    switch (place.kind) {
      case 'PROJECT':
        return catalogTables(tx, { companyId, only: { projectId: place.projectId }, given })
      case 'COMPANY': {
        const reads = await copiesReadBy(deps, tx, { companyId, role })
        const only = reads === 'ALL' ? 'ALL' : { copies: reads }
        return catalogTables(tx, { companyId, only, given })
      }
      default:
        return place satisfies never
    }
  }
}
