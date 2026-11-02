import { createFileRoute } from '@tanstack/react-router'
import { Automations, loadAutomations } from '../../../../builder/automations/public.ts'
import { RouteReadFailure } from '../../../../ui/states.tsx'

// The person's own automations of the company's Início (web W29); a member's read is not found (S10).
export const Route = createFileRoute('/_app/companies/$companyId/automations/')({
  staticData: { place: 'Automações' },
  loader: ({ context, params }) => loadAutomations(context.queryClient, params),
  errorComponent: RouteReadFailure,
  component: AutomationsPage,
})

function AutomationsPage() {
  const { companyId } = Route.useParams()
  return <Automations companyId={companyId} />
}
