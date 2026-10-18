import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { createProject, deleteProject, getProject, listProjects } from '@conexus/hub-api'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

export function projectsQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listProjects, { params: { companyId }, query: { page } })
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
