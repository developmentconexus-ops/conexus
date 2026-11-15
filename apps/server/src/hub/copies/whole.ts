import type { CompanyId, CopyId } from '@conexus/hub-api'
import { inArray } from 'drizzle-orm'
import { databaseFailure } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { isIncremental } from './mode.ts'
import type { CopiesDeps } from './store.ts'
import { companyScope, parsedCopy } from './store.ts'
import { copy } from './tables.ts'

/** The copies' ids without a weekly row, by company. */
function byCompany(missing: readonly { companyId: CompanyId; copyId: CopyId }[]) {
  const found = new Map<CompanyId, CopyId[]>()
  for (const { companyId, copyId } of missing)
    found.set(companyId, [...(found.get(companyId) ?? []), copyId])
  return found
}

/**
 * One pass at start, after the Hub answers (as `repairApps`): each incremental copy that has a
 * normal schedule row and no weekly one gets the weekly row, in the normal row's state, with the
 * normal row left as it is. A company that fails is logged and left for the next start.
 */
export async function ensureWholeLines(deps: CopiesDeps): Promise<void> {
  const grouped = byCompany(await deps.clock().wholeMissing())
  let count = 0
  for (const [companyId, ids] of grouped) {
    try {
      const rows = await deps.database.read(companyScope(companyId), (tx) =>
        tx.select().from(copy).where(inArray(copy.id, ids)),
      )
      for (const row of rows) {
        const stored = parsedCopy(row)
        if (!isIncremental(stored.definition)) continue
        await deps.clock().ensureWhole({ companyId, copyId: stored.id })
        count += 1
      }
    } catch (error) {
      const failure = error instanceof Failure ? error : databaseFailure(error)
      deps.log.error({ companyId, code: failure.code }, 'COPY_WHOLE_LINES_FAILED')
    }
  }
  deps.log.info({ companies: grouped.size, count }, 'COPY_WHOLE_LINES')
}
