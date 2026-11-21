import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CatalogTable, DataSources } from '@conexus/hub-api'
import { TABLE_PAGE_ROWS } from '@conexus/hub-api'
import type { Principal } from '../access/public.ts'
import type { DataDeps } from './deps.ts'

type Page = Awaited<ReturnType<DataSources['rows']>>

/** One page of a catalog table from the company's database, as the asker's role, in any place; when it cannot be read there it is not read live in its place. */
export async function rowsOf(
  deps: DataDeps,
  scope: Principal,
  a: { table: CatalogTable; signal?: AbortSignal },
): Promise<Page> {
  const { companyId, personId } = scope
  const { tableRows, readers } = deps.copies()
  const reader = await deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    const proof = await deps.identity.admitMember({
      tx,
      companyId,
      personId,
      action: 'readCompany',
    })
    return readers.readerOf(deps, tx, { companyId, role: proof.role })
  })
  const read = await tableRows({
    ...{ companyId, personId, name: a.table.name, limit: TABLE_PAGE_ROWS },
    reader,
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
