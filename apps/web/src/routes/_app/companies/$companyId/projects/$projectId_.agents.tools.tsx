import { createFileRoute } from '@tanstack/react-router'
import { AgentsReadFailure, AreaPending } from '../../../../../builder/agents/public.ts'
import { loadTools, ToolsTab } from '../../../../../builder/tools/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'

// The tab Ferramentas of a Projeto's agents: the library's tools it may use, beside the agents' list (web W29, W31).
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/tools',
)({
  staticData: { place: 'Agentes' },
  params: projectParams,
  loader: ({ context, params }) => loadTools(context.queryClient, params),
  errorComponent: AgentsReadFailure,
  pendingComponent: AreaPending,
  component: Tools,
})

function Tools() {
  const { companyId, projectId } = Route.useParams()
  return <ToolsTab companyId={companyId} projectId={projectId} />
}
