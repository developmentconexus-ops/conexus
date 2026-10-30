import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { dayOf } from '../../platform/dates.ts'
import { SectionTitle } from '../../ui/list.tsx'
import { DeleteProjectDialog } from './delete-project-dialog.tsx'
import { projectQuery } from './queries.ts'

/**
 * The Sobre of a Projeto: its date and address, and for those the Hub lets delete it, its deletion.
 * The name is at the head of the sidebar, so it is not repeated here.
 */
export function About({ companyId, projectId }: { companyId: CompanyId; projectId: ProjectId }) {
  const { project } = useSuspenseQuery(projectQuery(companyId, projectId)).data
  return (
    <div className="flex flex-col gap-xl">
      <SectionTitle>Sobre</SectionTitle>
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
