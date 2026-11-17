import type { CompanyId, ProjectId } from '@conexus/hub-api'
import {
  cancelAppInvitation,
  changeAppAccess,
  createProject,
  deleteProject,
  getProject,
  grantProjectCopy,
  inviteToApp,
  listAppAccess,
  listProjectCopies,
  listProjects,
  revokeAppAccess,
  revokeProjectCopy,
} from '@conexus/hub-api'
import type { QueryKey } from '@tanstack/react-query'
import { infiniteQueryOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

export function projectsQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listProjects, { params: { companyId }, query: { page } })
}
const FIRST_PAGE: string | undefined = undefined

function withoutText(key: QueryKey) {
  return JSON.stringify(key, (name, value: unknown) => (name === 'q' ? undefined : value))
}

/** The company's Projects a page at a time, all of them or those whose name holds the text (code C44). */
export function projectsPagedQuery(companyId: CompanyId, q: string | undefined) {
  const queryKey = [...hubQueryPrefix(listProjects, { companyId }), 'paged', { q }]
  const here = withoutText(queryKey)
  return infiniteQueryOptions({
    queryKey,
    initialPageParam: FIRST_PAGE,
    queryFn: (context) =>
      hubQuery(listProjects, {
        params: { companyId },
        query: { page: context.pageParam, q },
      }).queryFn(context),
    getNextPageParam: (last) => (last.next.kind === 'MORE' ? last.next.page : undefined),
    placeholderData: (previous, previousQuery) =>
      previousQuery !== undefined && withoutText(previousQuery.queryKey) === here
        ? previous
        : undefined,
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

/** The company's copies and whether this Projeto may read each: what a Liberar or a Tirar makes stale. */
export function projectCopiesQuery(companyId: CompanyId, projectId: ProjectId) {
  return hubQuery(listProjectCopies, { params: { companyId, projectId } })
}
export const sendCopyGrant = hubMutation(grantProjectCopy)
export const sendCopyRevoke = hubMutation(revokeProjectCopy)
