import type { CompanyId, LakeTableId } from '@conexus/hub-api'
import { listLakeTableRuns, listLakeTables } from '@conexus/hub-api'
import { hubQuery } from '../../platform/hub.ts'

/** The company's lake tables of the connections the person reads: Dados and the tree read it. */
export function lakeTablesListQuery(companyId: CompanyId) {
  return hubQuery(listLakeTables, { params: { companyId } })
}

/** The rounds of the copy that carried one table. */
export function lakeTableRunsQuery(companyId: CompanyId, tableId: LakeTableId) {
  return hubQuery(listLakeTableRuns, { params: { companyId, tableId } })
}
