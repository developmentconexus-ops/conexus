import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { createAppFrameHandoff, getProject } from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { hubMutation, hubQueryPrefix } from '../../platform/hub.ts'

// The pass changes no Hub data, so it keeps the cache the other writes refresh.
export const sendFrameHandoff = {
  ...hubMutation(createAppFrameHandoff),
  meta: { keepCache: true },
} as const

/** The Prévia reads the Projeto again: the app has a version on the air. */
export function previewChanged(
  queryClient: QueryClient,
  ids: { companyId: CompanyId; projectId: ProjectId },
) {
  return queryClient.invalidateQueries({ queryKey: hubQueryPrefix(getProject, ids) })
}
