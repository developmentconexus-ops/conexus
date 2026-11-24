import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { projectQuery } from './queries.ts'

function ProjectName(props: { companyId: CompanyId; projectId: ProjectId }) {
  return useQuery(projectQuery(props.companyId, props.projectId)).data?.project.name ?? null
}

/** Where a thing runs, as a person says it: the Início, or the Projeto's name once the Hub has answered. */
export function PlaceName(props: { companyId: CompanyId; projectId: ProjectId | null }) {
  return props.projectId === null ? (
    'Início'
  ) : (
    <ProjectName companyId={props.companyId} projectId={props.projectId} />
  )
}
