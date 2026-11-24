import { createFileRoute } from '@tanstack/react-router'
import { AgentsReadFailure, AreaPending } from '../../../../../builder/agents/public.ts'
import { loadTool, ToolPage, toolParams } from '../../../../../builder/tools/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'

// One tool of the library: its versions and Nova versão. `tools_` keeps it out of the tab's own route.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/agents/tools_/$toolId',
)({
  staticData: { place: 'Agentes' },
  params: {
    parse: (raw) => ({ ...projectParams.parse(raw), ...toolParams.parse(raw) }),
    stringify: (p) => p,
  },
  loader: ({ context, params }) => loadTool(context.queryClient, params, params.toolId),
  errorComponent: AgentsReadFailure,
  pendingComponent: AreaPending,
  component: Tool,
})

function Tool() {
  const { companyId, projectId, toolId } = Route.useParams()
  return <ToolPage companyId={companyId} projectId={projectId} toolId={toolId} />
}
