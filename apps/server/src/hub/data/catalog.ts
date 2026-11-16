import type { Described } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { Principal } from '../access/public.ts'
import type { DataDeps } from './deps.ts'

/** What the place may use, as the access door lists it for the principal. */
export async function catalogOf(deps: DataDeps, principal: Principal): Promise<Described> {
  try {
    const view = await deps.access.viewOf(principal)
    return { kind: 'CATALOG', systems: [...view.list('system')], tables: [...view.list('table')] }
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId: principal.companyId }, 'DATA_CATALOG_FAILED')
    return { kind: 'CATALOG_UNAVAILABLE' }
  }
}
