import { createFileRoute } from '@tanstack/react-router'
import { AssistantProject } from '../../../../../builder/assistant/public.ts'
import { projectParams, projectQuery } from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// Conversas of a Projeto: outside Construir's workbench, a page of its own, like Sobre (web W29, W31).
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/assistant/')({
  staticData: { place: 'Conversas' },
  params: projectParams,
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
    ),
  component: Conversations,
})

function Conversations() {
  const { companyId, projectId } = Route.useParams()
  return <AssistantProject companyId={companyId} projectId={projectId} />
}
