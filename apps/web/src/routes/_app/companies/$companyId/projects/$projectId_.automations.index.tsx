import { createFileRoute } from '@tanstack/react-router'
import { Automations, loadAutomations } from '../../../../../builder/automations/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

// The person's own automations of one Projeto: a page of its own beside Construir (web W29, W31).
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/automations/',
)({
  staticData: { place: 'Automações' },
  params: projectParams,
  loader: ({ context, params }) => loadAutomations(context.queryClient, params),
  errorComponent: RouteReadFailure,
  component: AutomationsPage,
})

function AutomationsPage() {
  const { companyId, projectId } = Route.useParams()
  return <Automations companyId={companyId} projectId={projectId} />
}
