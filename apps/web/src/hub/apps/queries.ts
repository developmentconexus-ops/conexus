import type { CompanyId, ProjectId } from '@conexus/hub-api'
import {
  createAppVersion,
  listAppVersions,
  setLiveVersion,
  VERSION_SEND_DEADLINE_MS,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function versionsQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listAppVersions, { params: { companyId, projectId } })
}

export const sendVersion = hubMutation(createAppVersion, {
  deadlineMs: VERSION_SEND_DEADLINE_MS,
})
export const sendLiveVersion = hubMutation(setLiveVersion)
