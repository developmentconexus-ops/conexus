import { createFileRoute } from '@tanstack/react-router'
import {
  AgentsArea,
  AgentsReadFailure,
  AreaPending,
  loadArea,
} from '../../../../../builder/agents/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'

// The area of a Projeto's agents: the Construtor and the agents' list, a page beside Construir (web W29, W31).
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/agents/')({
  staticData: { place: 'Agentes' },
  params: projectParams,
  loader: ({ context, params }) => loadArea(context.queryClient, params),
  errorComponent: AgentsReadFailure,
  pendingComponent: AreaPending,
  component: Area,
})

function Area() {
  const { companyId, projectId } = Route.useParams()
  return <AgentsArea companyId={companyId} projectId={projectId} />
}
