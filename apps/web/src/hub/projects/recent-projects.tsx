import type { CompanyId, PersonId } from '@conexus/hub-api'
import { ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import type { RememberedList } from '../../platform/remembered.ts'
import { recall, remember } from '../../platform/remembered.ts'
import { projectsQuery } from './queries.ts'

const SHOWN = 5

function listOf(companyId: CompanyId): RememberedList<typeof ProjectId> {
  return { name: `projects.${companyId}`, id: ProjectId, keep: SHOWN }
}

export function rememberProject(input: {
  personId: PersonId
  companyId: CompanyId
  projectId: ProjectId
}): void {
  remember({ list: listOf(input.companyId), personId: input.personId, id: input.projectId })
}

/**
 * The Projects opened last in this browser that the Hub still lists, then the first of the list, up
 * to five. Only the list's first page counts.
 */
export function useRecentProjects(companyId: CompanyId, personId: PersonId) {
  const read = useQuery(projectsQuery(companyId, undefined))
  const listed = read.data?.projects ?? []
  const opened = recall({ list: listOf(companyId), personId })
  const recent = [
    ...opened.flatMap((id) => listed.filter((project) => project.id === id)),
    ...listed.filter((project) => !opened.includes(project.id)),
  ].slice(0, SHOWN)
  return { read, recent }
}
