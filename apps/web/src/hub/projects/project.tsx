import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { dayOf } from '../../platform/dates.ts'
import { PageTitle } from '../../ui/list.tsx'
import { DeleteProjectDialog } from './delete-project-dialog.tsx'
import { projectQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/** The Sobre of a Projeto: its name, date and address, and for those the Hub lets delete it, its deletion. */
export function About() {
  const { companyId, projectId } = route.useParams()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle className="break-words">{project.name}</PageTitle>
      <p className="text-label text-text-2">Criado em {dayOf(project.createdAt)}</p>
      {project.address !== null && (
        <p className="text-label text-text-2">
          Endereço do app: <span className="font-mono text-fact">{project.address}</span>
        </p>
      )}
      {project.mayDelete ? (
        <div>
          <DeleteProjectDialog companyId={companyId} project={project} />
        </div>
      ) : (
        <p className="text-label text-text-2">
          Só o dono ou quem administra a empresa pode apagar o Projeto.
        </p>
      )}
    </div>
  )
}
