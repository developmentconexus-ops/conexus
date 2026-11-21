import type { CompanyId, DataReadFilters } from '@conexus/hub-api'
import { exportDataReads, listDataReads } from '@conexus/hub-api'
import { mutationOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

/** One page of the company's Registro de dados under the filters of the address. */
export function dataReadsQuery(
  companyId: CompanyId,
  filters: DataReadFilters,
  page: string | undefined,
) {
  return hubQuery(listDataReads, { params: { companyId }, query: { ...filters, page } })
}

/** The reads of a period for the file: a read, so it leaves the cache as it is (web W12). */
export const exportReads = mutationOptions({
  ...hubMutation(exportDataReads),
  meta: { keepCache: true },
})
