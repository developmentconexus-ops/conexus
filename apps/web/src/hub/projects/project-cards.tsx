import type { CompanyId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { dayOf } from '../../platform/dates.ts'
import { Stamp } from '../../ui/block.tsx'
import { Card } from '../../ui/card.tsx'
import { NewProjectDialog } from './new-project-dialog.tsx'
import {
  ASK_ON_HOME,
  NO_PROJECTS_TITLE,
  projectStateOf,
  projectStateText,
} from './project-state.ts'
import { projectsQuery } from './queries.ts'

/**
 * A page of the company's Projects as cards (design `project-card`): a preview band on top, which
 * holds the name's first letter until a Projeto has a picture of its app, then the name and the day
 * it was created, each opening its Projeto, with its app's state in words.
 */
export function ProjectCards(props: {
  companyId: CompanyId
  page: string | undefined
  creates: boolean
}) {
  const { companyId } = props
  const { projects } = useSuspenseQuery(projectsQuery(companyId, props.page)).data
  if (projects.length === 0) return <NoProjects companyId={companyId} creates={props.creates} />
  return (
    <ul className="grid gap-md sm:grid-cols-2 sm:gap-lg lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id} className="min-w-0">
          <Card className="group/card items-stretch gap-0 p-0 hover:border-line-strong">
            <Link
              to="/companies/$companyId/projects/$projectId"
              params={{ companyId, projectId: project.id }}
              className="flex overflow-hidden rounded-[inherit] sm:flex-col"
            >
              <span
                aria-hidden="true"
                className="flex w-16 shrink-0 items-center justify-center border-e border-line bg-surface-3 font-display text-display text-text-2 group-hover/card:bg-surface-4 sm:h-28 sm:w-auto sm:items-end sm:justify-start sm:border-e-0 sm:border-b sm:px-lg sm:pb-md"
              >
                {project.name.charAt(0).toLocaleUpperCase('pt-BR')}
              </span>
              <span className="flex min-w-0 flex-col gap-xs px-lg py-md">
                <span className="truncate font-display text-title text-text">{project.name}</span>
                <Stamp tone={projectStateOf(project).kind === 'PUBLISHED' ? 'success' : 'neutral'}>
                  {projectStateText(projectStateOf(project))}
                </Stamp>
                <span className="text-label text-text-2">Criado em {dayOf(project.createdAt)}</span>
              </span>
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  )
}

/** With no Projeto, a centred column of 448 at most: the title, "Novo projeto" for who may, and the way to Início. */
function NoProjects(props: { companyId: CompanyId; creates: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[28rem] flex-col items-center gap-md py-xl text-center">
      <p className="font-display text-title">{NO_PROJECTS_TITLE}</p>
      {props.creates && <NewProjectDialog companyId={props.companyId} block labelled />}
      <Link
        to="/companies/$companyId"
        params={{ companyId: props.companyId }}
        className="text-label text-text-2 hover:text-text"
      >
        {ASK_ON_HOME}
      </Link>
    </div>
  )
}
