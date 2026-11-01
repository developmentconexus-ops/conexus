import { createFileRoute } from '@tanstack/react-router'
import { connectionsQuery, projectConnectionsQuery } from '../../../../../hub/connectors/public.ts'
import {
  ProjectIntegrations,
  projectParams,
  projectQuery,
} from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

// Like Sobre and Quem usa o app, a page of its own beside the Construir's workbench.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/integrations',
)({
  staticData: { place: 'Integrações' },
  params: projectParams,
  // The page's three reads, started together: the Projeto, what it reads, and the company's list.
  loader: ({ context, params }) => {
    const { queryClient } = context
    const { companyId, projectId } = params
    return readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(projectQuery(companyId, projectId)),
        queryClient.ensureQueryData(projectConnectionsQuery(companyId, projectId)),
        queryClient.ensureQueryData(connectionsQuery(companyId)),
      ]),
    )
  },
  errorComponent: RouteReadFailure,
  component: IntegrationsPage,
})

function IntegrationsPage() {
  const { companyId, projectId } = Route.useParams()
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-xl">
      <ProjectIntegrations companyId={companyId} projectId={projectId} />
    </div>
  )
}
