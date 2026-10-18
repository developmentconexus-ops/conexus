import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { dayOf } from '../../platform/dates.ts'
import { buttonVariants } from '../../ui/button.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { DeleteProjectDialog } from './delete-project-dialog.tsx'
import { projectQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/** A Project: its name and date, and for those the Hub lets delete it, its deletion. */
export function Project() {
  const { companyId, projectId } = route.useParams()
  const { data } = useSuspenseQuery(projectQuery(companyId, projectId))
  const { project } = data
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="break-words">{project.name}</PageTitle>
      <p className="text-label text-text-2">Criado em {dayOf(project.createdAt)}</p>
      {project.address !== null && (
        <div className="flex flex-col items-start gap-md">
          <p className="text-label text-text-2">
            Endereço do app: <span className="font-mono text-fact">{project.address}</span>
          </p>
          <a
            href={`https://${project.address}/`}
            className={buttonVariants({ variant: 'primary' })}
          >
            Abrir app
          </a>
        </div>
      )}
      {project.mayDelete && (
        <div>
          <DeleteProjectDialog companyId={companyId} project={project} />
        </div>
      )}
    </div>
  )
}
