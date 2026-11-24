import { ProjectId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AgentsPage, loadAgents } from '../../../../builder/agents/public.ts'
import { RouteReadFailure } from '../../../../ui/states.tsx'

// The company's agents at Início, filtered by the Projeto of the address (web W18, W29); a member's read is not found (S10).
export const Route = createFileRoute('/_app/companies/$companyId/agents/')({
  staticData: { place: 'Agentes' },
  validateSearch: z.object({ projectId: ProjectId.optional().catch(undefined) }),
  loaderDeps: ({ search }) => ({ projectId: search.projectId }),
  loader: ({ context, params, deps }) =>
    loadAgents(context.queryClient, { companyId: params.companyId, projectId: deps.projectId }),
  errorComponent: RouteReadFailure,
  component: AgentsIndex,
})

function AgentsIndex() {
  const { companyId } = Route.useParams()
  const { projectId } = Route.useSearch()
  return <AgentsPage companyId={companyId} projectId={projectId} />
}
