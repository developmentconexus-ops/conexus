import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { listAppVersions, setLiveVersion } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function versionsQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listAppVersions, { params: { companyId, projectId } })
}

export const sendLiveVersion = hubMutation(setLiveVersion)
