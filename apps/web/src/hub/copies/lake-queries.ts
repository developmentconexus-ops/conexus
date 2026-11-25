import type { CompanyId, LakeTableId } from '@conexus/hub-api'
import { listLakeTableRuns, listLakeTables } from '@conexus/hub-api'
import { queryOptions } from '@tanstack/react-query'
import { hubQuery } from '../../platform/hub.ts'

const WHILE_RUNNING = 5_000

/** The company's lake tables of the connections the person reads, read again every 5 s while a round runs (web W12): Dados and the tree read it. */
export function lakeTablesListQuery(companyId: CompanyId) {
  return queryOptions({
    ...hubQuery(listLakeTables, { params: { companyId } }),
    refetchInterval: (query) =>
      query.state.data?.some((table) => table.lastRun?.outcome === 'RUNNING')
        ? WHILE_RUNNING
        : false,
  })
}

/** The rounds of the copy that carried one table, read again every 5 s while one runs. */
export function lakeTableRunsQuery(companyId: CompanyId, tableId: LakeTableId) {
  return queryOptions({
    ...hubQuery(listLakeTableRuns, { params: { companyId, tableId } }),
    refetchInterval: (query) =>
      query.state.data?.some((run) => run.outcome === 'RUNNING') ? WHILE_RUNNING : false,
  })
}
