import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PageTitle } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { Pager } from '../../ui/pager.tsx'
import { NewProjectDialog } from './new-project-dialog.tsx'
import { ProjectCards } from './project-cards.tsx'
import { PROJECTS_SENTENCE } from './project-state.ts'
import { projectsQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/')

/**
 * "Todos os projetos": the company's Projects, 50 a page, the page in the address (web W18), with
 * "Novo projeto" at the top for whoever may create one (step 24.3.3, U3).
 */
export function Projects() {
  const { companyId } = route.useParams()
  const creates = route.useRouteContext().role !== 'member'
  const { page, notice: arrived } = route.useSearch()
  const navigate = route.useNavigate()
  // The notice is for this visit: it leaves the address, so a reload or a copied link does not repeat it.
  const [notice] = useState(arrived)
  useEffect(() => {
    if (arrived) void navigate({ search: { page }, replace: true })
  }, [arrived, navigate, page])
  const { next } = useSuspenseQuery(projectsQuery(companyId, page)).data
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-xl">
      <header className="flex flex-wrap items-start justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <PageTitle>Todos os projetos</PageTitle>
          <p className="text-text-2">{PROJECTS_SENTENCE}</p>
        </div>
        {creates && <NewProjectDialog companyId={companyId} block />}
      </header>
      {notice && <Notice>Projeto apagado.</Notice>}
      <ProjectCards companyId={companyId} page={page} creates={creates} />
      <Pager next={next} param="page" page={page} list="Projetos" />
    </div>
  )
}
