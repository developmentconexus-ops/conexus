import type { CompanyId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { PageTitle, SectionTitle } from '../../ui/list.tsx'
import { companyQuery } from '../identity/public.ts'
import { CreateProjectForm } from './create-project-form.tsx'
import { ProjectCards } from './project-cards.tsx'
import { projectsQuery } from './queries.ts'

/**
 * A company's Início (web W29): "O que vamos construir?" with the name of a new Projeto, which
 * step 13 turns into the composer, and the Projects below. `aside` comes first, for the card of
 * what the company still needs.
 */
export function Home(props: { companyId: CompanyId; aside?: ReactNode }) {
  const { companyId } = props
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const { databaseReady, next } = useSuspenseQuery(projectsQuery(companyId, undefined)).data
  return (
    <div className="flex w-full max-w-page flex-col gap-2xl">
      {props.aside}
      <section className="flex flex-col gap-lg">
        <PageTitle className="text-display">O que vamos construir?</PageTitle>
        <CreateProjectForm company={company} databaseReady={databaseReady} />
      </section>
      <section className="flex flex-col gap-lg">
        <SectionTitle>Projetos</SectionTitle>
        <ProjectCards companyId={companyId} page={undefined} />
        {next.kind === 'MORE' && (
          <Link to="/companies/$companyId/projects" params={{ companyId }} className="text-label">
            Todos os projetos
          </Link>
        )}
      </section>
    </div>
  )
}
