import type { CompanyId, ProjectId } from '@conexus/hub-api'
import {
  createAppHandoff,
  createAppVersion,
  listAppVersions,
  setLiveVersion,
  VERSION_SEND_DEADLINE_MS,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

// A pass changes nothing the screens read, so it keeps the cache (web W12).
export const openAppHandoff = {
  ...hubMutation(createAppHandoff),
  meta: { keepCache: true },
} as const

export function versionsQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listAppVersions, { params: { companyId, projectId } })
}

export const sendVersion = hubMutation(createAppVersion, {
  deadlineMs: VERSION_SEND_DEADLINE_MS,
})
export const sendLiveVersion = hubMutation(setLiveVersion)
