import type { CompanyId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageTitle } from '../../ui/list.tsx'
import { ProjectCards } from './project-cards.tsx'
import { projectsQuery } from './queries.ts'

/**
 * A company's Início (web W29): `aside` first, for what the company still needs, then "O que vamos
 * construir?" centred over `start`, the box that starts a Projeto, and the Projects below at the
 * page's width.
 */
export function Home(props: { companyId: CompanyId; aside?: ReactNode; start: ReactNode }) {
  const { companyId } = props
  const { projects, next } = useSuspenseQuery(projectsQuery(companyId, undefined)).data
  return (
    <div className="flex w-full max-w-page flex-col gap-2xl pb-2xl">
      {props.aside}
      <section aria-labelledby="start-title" className="flex flex-col gap-lg">
        <PageTitle className="text-balance text-center text-display max-md:text-display-narrow">
          <span id="start-title">O que vamos construir?</span>
        </PageTitle>
        {props.start}
      </section>
      <section aria-labelledby="projects-title" className="flex flex-col gap-md">
        <div className="flex items-baseline justify-between gap-md">
          <h2 id="projects-title" className="flex items-baseline gap-sm font-display text-title">
            Projetos
            {projects.length > 0 && next.kind !== 'MORE' && (
              <span className="font-body text-label font-normal tabular-nums text-text-2">
                {projects.length}
              </span>
            )}
          </h2>
          {next.kind === 'MORE' && (
            <Link
              to="/companies/$companyId/projects"
              params={{ companyId }}
              className="text-label text-text-2 underline-offset-4 hover:text-text hover:underline"
            >
              Todos os projetos
            </Link>
          )}
        </div>
        <ProjectCards companyId={companyId} page={undefined} />
      </section>
    </div>
  )
}
