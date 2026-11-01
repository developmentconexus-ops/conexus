import { createFileRoute } from '@tanstack/react-router'
import { Automations, automationsQuery } from '../../../../builder/automations/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../ui/states.tsx'

// The person's own automations of the company's Início (web W29); a member's read is not found (S10).
export const Route = createFileRoute('/_app/companies/$companyId/automations/')({
  staticData: { place: 'Automações' },
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(automationsQuery(params.companyId, undefined)),
    ),
  errorComponent: RouteReadFailure,
  component: AutomationsPage,
})

function AutomationsPage() {
  const { companyId } = Route.useParams()
  return <Automations companyId={companyId} />
}
