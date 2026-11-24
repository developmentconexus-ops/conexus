import type { CompanyId, ProjectId } from '@conexus/hub-api'
import {
  cancelAppInvitation,
  changeAppAccess,
  createProject,
  deleteProject,
  getProject,
  inviteToApp,
  listAppAccess,
  listProjects,
  revokeAppAccess,
} from '@conexus/hub-api'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix, keepWhileTextChanges } from '../../platform/hub.ts'

export function projectsQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listProjects, { params: { companyId }, query: { page } })
}
const FIRST_PAGE: string | undefined = undefined

/** The company's Projects a page at a time, all of them or those whose name holds the text (code C44). */
export function projectsPagedQuery(companyId: CompanyId, q: string | undefined) {
  const queryKey = [...hubQueryPrefix(listProjects, { companyId }), 'paged', { q }]
  return infiniteQueryOptions({
    queryKey,
    initialPageParam: FIRST_PAGE,
    queryFn: (context) =>
      hubQuery(listProjects, {
        params: { companyId },
        query: { page: context.pageParam, q },
      }).queryFn(context),
    getNextPageParam: (last) => (last.next.kind === 'MORE' ? last.next.page : undefined),
    placeholderData: keepWhileTextChanges(queryKey),
  })
}
/** Every page of a company's Projects. */
export function allProjectsQueryKey(companyId: CompanyId) {
  return hubQueryPrefix(listProjects, { companyId })
}
export function projectQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(getProject, { params: { companyId, projectId } })
}

export const sendProject = hubMutation(createProject)
export const sendProjectDeletion = hubMutation(deleteProject)

export function appAccessQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listAppAccess, { params: { companyId, projectId } })
}
export const sendAppInvitation = hubMutation(inviteToApp)
export const sendAppRole = hubMutation(changeAppAccess)
export const sendAppRevocation = hubMutation(revokeAppAccess)
export const sendAppInvitationCancel = hubMutation(cancelAppInvitation)
