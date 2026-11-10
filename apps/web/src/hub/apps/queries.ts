import type { AppTableName, CompanyId, ProjectId } from '@conexus/hub-api'
import { listAppRows, listAppTables, listAppVersions, publishAppVersion } from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function versionsQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listAppVersions, { params: { companyId, projectId } })
}

export const publishVersion = hubMutation(publishAppVersion)

export function appTablesQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listAppTables, { params: { companyId, projectId } })
}

export function appRowsQuery(
  companyId: CompanyId,
  projectId: ProjectId,
  table: AppTableName,
  page: string | undefined,
) {
  return hubQuery(listAppRows, { params: { companyId, projectId, table }, query: { page } })
}
