import type { AccessSources } from '../access/public.ts'
import { catalogTables } from './catalog-view.ts'
import { copiesReadBy } from './readers.ts'
import type { CopiesDeps } from './store.ts'

/** The copies a place reads: those the role reads, and in a Projeto only those released to it too. */
export function accessTables(deps: Pick<CopiesDeps, 'identity'>): AccessSources['tables'] {
  return async (tx, { companyId, place, role, given }) => {
    const reads = await copiesReadBy(deps, tx, { companyId, role })
    switch (place.kind) {
      case 'PROJECT':
        return catalogTables(tx, { companyId, only: { projectId: place.projectId, reads }, given })
      case 'COMPANY':
        return catalogTables(tx, {
          companyId,
          only: reads === 'ALL' ? 'ALL' : { copies: reads },
          given,
        })
      default:
        return place satisfies never
    }
  }
}
