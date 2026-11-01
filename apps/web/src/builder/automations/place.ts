import type { AutomationSummary, CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { projectsQuery } from '../../hub/projects/public.ts'

/** Where an automation runs, as a person says it: the Início, or the Projeto's name. */
export function usePlaceName(companyId: CompanyId, projectId: ProjectId | null): string {
  const projects = useQuery(projectsQuery(companyId, undefined)).data?.projects
  if (projectId === null) return 'Início'
  return projects?.find((project) => project.id === projectId)?.name ?? 'Projeto'
}

/** The names of the connections an automation reads, in the order its place offers them. */
export function readNames(automation: Pick<AutomationSummary, 'connections'>): string {
  return automation.connections
    .filter((each) => each.chosen)
    .map((each) => each.name)
    .join(', ')
}
