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
      const { catalogTables } = deps.copies()
      const systems = await deps.connectors().catalogSystems(tx, scope)
      const tables =
        place.kind === 'PROJECT'
          ? await catalogTables(tx, { companyId, only: { projectId: place.projectId } })
          : deps.identity.allows(proof.role, 'readCopyRows')
            ? await catalogTables(tx, { companyId, only: 'ALL' })
            : []
      return { kind: 'CATALOG', systems, tables }
    })
  } catch (error) {
    if (!(error instanceof Failure) || error.code !== 'DATABASE_UNAVAILABLE') throw error
    logFailure(deps.log, error, { companyId }, 'DATA_CATALOG_FAILED')
    return { kind: 'CATALOG_UNAVAILABLE' }
  }
}
