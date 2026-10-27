import type { CompanyId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { dayOf } from '../../platform/dates.ts'
import { Empty } from '../../ui/states.tsx'
import { projectsQuery } from './queries.ts'

/**
 * A page of the company's Projects as cards (design `project-card`): a preview band on top, which
 * holds the name's first letter until a Projeto has a picture of its app, then the name and the day
 * it was created, each opening its Projeto.
 */
export function ProjectCards(props: { companyId: CompanyId; page: string | undefined }) {
  const { companyId } = props
  const { projects } = useSuspenseQuery(projectsQuery(companyId, props.page)).data
  if (projects.length === 0) return <Empty>Nenhum projeto ainda.</Empty>
  return (
    <ul className="grid gap-md sm:grid-cols-2 sm:gap-lg lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id} className="min-w-0">
          <Link
            to="/companies/$companyId/projects/$projectId"
            params={{ companyId, projectId: project.id }}
            className="group/card flex overflow-hidden rounded-card border border-line bg-surface hover:border-line-strong sm:flex-col"
          >
            <span
              aria-hidden="true"
              className="flex w-16 shrink-0 items-center justify-center border-e border-line bg-surface-3 font-display text-display text-text-2 group-hover/card:bg-surface-4 sm:h-28 sm:w-auto sm:items-end sm:justify-start sm:border-e-0 sm:border-b sm:px-lg sm:pb-md"
            >
              {project.name.charAt(0).toLocaleUpperCase('pt-BR')}
            </span>
            <span className="flex min-w-0 flex-col gap-xs px-lg py-md">
              <span className="truncate font-display text-title text-text">{project.name}</span>
              <span className="text-label text-text-2">Criado em {dayOf(project.createdAt)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
