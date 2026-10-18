import type { CompanyId, ProjectSummary } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { List, PageTitle, Row, rowBody } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { Pager } from '../../ui/pager.tsx'
import { Empty } from '../../ui/states.tsx'
import { companyQuery } from '../identity/public.ts'
import { CreateProjectForm } from './create-project-form.tsx'
import { projectsQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/')

function ProjectRow({ companyId, project }: { companyId: CompanyId; project: ProjectSummary }) {
  return (
    <Row>
      <Link
        to="/companies/$companyId/projects/$projectId"
        params={{ companyId, projectId: project.id }}
        className={rowBody({ kind: 'link' })}
      >
        <span className="min-w-0 truncate">{project.name}</span>
        <span className="shrink-0 text-label text-text-2">
          Criado em {dayOf(project.createdAt)}
        </span>
      </Link>
    </Row>
  )
}

/** A company's Projects, 50 a page, the page in the address (web W18), and the form that creates one. */
export function Projects() {
  const { companyId } = route.useParams()
  const { page, notice: arrived } = route.useSearch()
  const navigate = route.useNavigate()
  // The notice is for this visit: it leaves the address, so a reload or a copied link does not repeat it.
  const [notice] = useState(arrived)
  useEffect(() => {
    if (arrived) void navigate({ search: { page }, replace: true })
  }, [arrived, navigate, page])
  const { data } = useSuspenseQuery(projectsQuery(companyId, page))
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle>Projetos</PageTitle>
      {notice && <Notice>Projeto apagado.</Notice>}
      <CreateProjectForm company={company} databaseReady={data.databaseReady} />
      {data.projects.length === 0 ? (
        <Empty>Nenhum Projeto ainda.</Empty>
      ) : (
        <List>
          {data.projects.map((project) => (
            <ProjectRow key={project.id} companyId={companyId} project={project} />
          ))}
        </List>
      )}
      <Pager next={data.next} param="page" page={page} list="Projetos" />
    </div>
  )
}
