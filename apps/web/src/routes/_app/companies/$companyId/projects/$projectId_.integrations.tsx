import { createFileRoute } from '@tanstack/react-router'
import {
  ProjectIntegrations,
  projectParams,
  projectQuery,
} from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'

// Like Sobre and Quem usa o app, a page of its own beside the Construir's workbench.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/integrations',
)({
  staticData: { place: 'Integrações' },
  params: projectParams,
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
    ),
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
