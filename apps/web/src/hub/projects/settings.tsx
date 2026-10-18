import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { buttonVariants } from '../../ui/button.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { Versions } from '../apps/public.ts'
import { projectQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId/settings')

/** The Configurações of a Projeto, for those the Hub lets manage its versions. */
export function Settings() {
  const { companyId, projectId } = route.useParams()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="break-words">Configurações</PageTitle>
      <p className="text-label text-text-2">
        Projeto <span className="break-words">{project.name}</span>
      </p>
      <div>
        <Link
          to="/companies/$companyId/projects/$projectId"
          params={{ companyId, projectId }}
          className={buttonVariants()}
        >
          Voltar ao Projeto
        </Link>
      </div>
      <Versions companyId={companyId} projectId={projectId} />
    </div>
  )
}
