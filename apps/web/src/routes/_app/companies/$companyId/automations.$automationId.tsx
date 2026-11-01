import { AutomationId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AutomationRuns, automationsQuery } from '../../../../builder/automations/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../ui/states.tsx'

// The history of one automation of the Início; one of the other floor, another person's or a deleted one is not found.
export const Route = createFileRoute('/_app/companies/$companyId/automations/$automationId')({
  staticData: { place: 'Automações' },
  params: {
    parse: (raw) => ({ automationId: idOrNotFound(AutomationId, raw.automationId) }),
    stringify: (p) => p,
  },
  validateSearch: z.object({ page: z.string().optional().catch(undefined) }),
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.ensureQueryData(automationsQuery(params.companyId, undefined)),
    ),
  errorComponent: RouteReadFailure,
  component: RunsPage,
})

function RunsPage() {
  const { companyId, automationId } = Route.useParams()
  const { page } = Route.useSearch()
  return <AutomationRuns companyId={companyId} automationId={automationId} page={page} />
}
