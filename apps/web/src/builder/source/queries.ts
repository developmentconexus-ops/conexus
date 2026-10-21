import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { readProjectFile, readProjectSource } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

export function sourceQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(readProjectSource, { params: { companyId, projectId } })
}

/** One file of a saved version: a version never changes, so what was read stays read. */
export function fileQuery(input: {
  companyId: CompanyId
  projectId: ProjectId
  commit: string
  path: string
}) {
  const { commit, path, ...params } = input
  return hubQuery(readProjectFile, { params, query: { commit, path } })
}

/** The Código tab reads again: a version was saved. */
export function sourceChanged(
  queryClient: QueryClient,
  ids: { companyId: CompanyId; projectId: ProjectId },
) {
  return queryClient.invalidateQueries({ queryKey: hubQueryPrefix(readProjectSource, ids) })
}
