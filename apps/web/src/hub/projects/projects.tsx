import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PageTitle } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { Pager } from '../../ui/pager.tsx'
import { ProjectCards } from './project-cards.tsx'
import { projectsQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/')

/** "Todos os projetos": the company's Projects, 50 a page, the page in the address (web W18). */
export function Projects() {
  const { companyId } = route.useParams()
  const { page, notice: arrived } = route.useSearch()
  const navigate = route.useNavigate()
  // The notice is for this visit: it leaves the address, so a reload or a copied link does not repeat it.
  const [notice] = useState(arrived)
  useEffect(() => {
    if (arrived) void navigate({ search: { page }, replace: true })
  }, [arrived, navigate, page])
  const { next } = useSuspenseQuery(projectsQuery(companyId, page)).data
  return (
    <div className="flex w-full max-w-page flex-col gap-xl">
      <PageTitle>Todos os projetos</PageTitle>
      {notice && <Notice>Projeto apagado.</Notice>}
      <ProjectCards companyId={companyId} page={page} />
      <Pager next={next} param="page" page={page} list="Projetos" />
    </div>
  )
}
