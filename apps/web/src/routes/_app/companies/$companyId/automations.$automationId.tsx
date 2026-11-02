import { createFileRoute } from '@tanstack/react-router'
import {
  AutomationRuns,
  automationParams,
  RunsSearch,
  runsDeps,
  runsLoader,
} from '../../../../builder/automations/public.ts'
import { RouteReadFailure } from '../../../../ui/states.tsx'

// The history of one automation of the Início; one of the other floor, another person's or a deleted one is not found.
export const Route = createFileRoute('/_app/companies/$companyId/automations/$automationId')({
  staticData: { place: 'Automações' },
  params: automationParams,
  validateSearch: RunsSearch,
  loaderDeps: runsDeps,
  loader: (open) => runsLoader(open),
  errorComponent: RouteReadFailure,
  component: RunsPage,
})

function RunsPage() {
  const { companyId, automationId } = Route.useParams()
  const { page } = Route.useSearch()
  return <AutomationRuns companyId={companyId} automationId={automationId} page={page} />
}
