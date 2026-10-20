import type { CompanyId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { dayOf } from '../../platform/dates.ts'
import { Empty } from '../../ui/states.tsx'
import { projectsQuery } from './queries.ts'

/**
 * A page of the company's Projects as cards (design `project-card`): the name and the day it was
 * created, each opening its Projeto. The state on the card comes with step 14.
 */
export function ProjectCards(props: { companyId: CompanyId; page: string | undefined }) {
  const { companyId } = props
  const { projects } = useSuspenseQuery(projectsQuery(companyId, props.page)).data
  if (projects.length === 0) return <Empty>Nenhum projeto ainda.</Empty>
  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(14rem,100%),1fr))] gap-lg">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            to="/companies/$companyId/projects/$projectId"
            params={{ companyId, projectId: project.id }}
            className="flex flex-col gap-xs rounded-card border border-line bg-surface p-lg hover:bg-surface-3"
          >
            <span className="truncate font-display text-title text-text">{project.name}</span>
            <span className="text-label text-text-2">Criado em {dayOf(project.createdAt)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
