import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { dayOf } from '../../platform/dates.ts'
import { DeleteProjectDialog } from './delete-project-dialog.tsx'
import { projectQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/projects/$projectId')

/**
 * The Sobre of a Projeto: its date and address, and for those the Hub lets delete it, its deletion.
 * The name is on the area's top line, so it is not repeated here.
 */
export function About() {
  const { companyId, projectId } = route.useParams()
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return (
    <div className="flex flex-col gap-xl">
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
