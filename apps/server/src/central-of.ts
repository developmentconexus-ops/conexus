import { createLakes } from './hub/lake/public.ts'
import { createOperations } from './hub/operations/public.ts'
import { deleteCompanyTreatments } from './hub/treatment/public.ts'

/** The Operations Central, and the lakes it frees with a client's database (card L.13). */
export function centralOf(
  deps: Omit<Parameters<typeof createOperations>[0], 'outside' | 'deleteCompanyTreatments'> &
    Parameters<typeof createLakes>[0],
) {
  const lakes = createLakes(deps)
  const outside = [deps.projects.companyDatabase, lakes.outside]
  return { lakes, operations: createOperations({ ...deps, outside, deleteCompanyTreatments }) }
}
