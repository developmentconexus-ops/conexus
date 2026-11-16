import type { Described } from '@conexus/hub-api'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { SessionScope } from '../connectors/public.ts'
import type { DataDeps } from './deps.ts'

/** What the place may use: the connections it offers and the copies it reads, in one reading of the Hub. */
export async function catalogOf(deps: DataDeps, scope: SessionScope): Promise<Described> {
  const { companyId, personId, place } = scope
  try {
    return await deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
      const proof = await deps.identity.admitMember({
        ...{ tx, companyId, personId },
        action: 'readCompany',
      })
      const { catalogTables, readers } = deps.copies()
      const { catalogSystems, catalogSources } = deps.connectors()
      const systems = await catalogSystems(tx, scope)
      const given = await catalogSources(tx, scope)
      if (place.kind === 'PROJECT') {
        const only = { projectId: place.projectId }
        return {
          kind: 'CATALOG',
          systems,
          tables: await catalogTables(tx, { companyId, only, given }),
        }
      }
      const reads = await readers.copiesReadBy(deps, tx, { companyId, role: proof.role })
      const only = reads === 'ALL' ? 'ALL' : { copies: reads }
      const tables = await catalogTables(tx, { companyId, only, given })
      return { kind: 'CATALOG', systems, tables }
    })
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId }, 'DATA_CATALOG_FAILED')
    return { kind: 'CATALOG_UNAVAILABLE' }
  }
}
