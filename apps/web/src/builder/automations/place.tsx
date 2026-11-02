import type { AutomationSummary, CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { projectQuery } from '../../hub/projects/public.ts'

function ProjectName(props: { companyId: CompanyId; projectId: ProjectId }) {
  return useQuery(projectQuery(props.companyId, props.projectId)).data?.project.name ?? null
}

/** Where an automation runs, as a person says it: the Início, or the Projeto's name once the Hub has answered. */
export function PlaceName(props: { companyId: CompanyId; projectId: ProjectId | null }) {
  return props.projectId === null ? (
    'Início'
  ) : (
    <ProjectName companyId={props.companyId} projectId={props.projectId} />
  )
}

/** The names of the connections an automation reads, in the order its place offers them. */
export function readNames(automation: Pick<AutomationSummary, 'connections'>): string {
  return automation.connections
    .filter((each) => each.chosen)
    .map((each) => each.name)
    .join(', ')
}
