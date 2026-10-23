import type { CompanyId } from '@conexus/hub-api'
import { readObservationalMemoryModels, setObservationalMemoryModel } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function observationalMemoryModelsQuery(companyId: CompanyId) {
  return hubQuery(readObservationalMemoryModels, { params: { companyId } })
}

export const setObservationalMemoryModelMutation = hubMutation(setObservationalMemoryModel)
