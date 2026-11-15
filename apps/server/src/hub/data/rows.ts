import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CatalogTable, DataSources } from '@conexus/hub-api'
import { TABLE_PAGE_ROWS } from '@conexus/hub-api'
import type { SessionScope } from '../connectors/public.ts'
import type { DataDeps } from './deps.ts'

type Page = Awaited<ReturnType<DataSources['rows']>>

/** One page of a catalog table from the company's database; when it cannot be read there it is not read live in its place. */
export async function rowsOf(
  deps: DataDeps,
  scope: SessionScope,
  a: { table: CatalogTable; signal?: AbortSignal },
): Promise<Page> {
  const { companyId } = scope
  const read = await deps.copies().tableRows({
    ...{ companyId, name: a.table.name, limit: TABLE_PAGE_ROWS },
    signal: a.signal ?? AbortSignal.timeout(APP_CALL_LIMITS.transactionTimeoutMs),
  })
  if (read.kind === 'ROWS') {
    return {
      kind: 'ROWS',
      rows: read.rows.map((row) =>
        Object.fromEntries(read.columns.map((column, at) => [column, row[at]])),
      ),
      complete: read.complete,
    }
  }
  const reason = read.kind === 'UNAVAILABLE' ? read.reason : read.kind
  deps.log.error({ companyId, table: a.table.name, reason }, 'DATA_ROWS_FAILED')
  return { kind: 'TABLE_UNAVAILABLE' }
}
