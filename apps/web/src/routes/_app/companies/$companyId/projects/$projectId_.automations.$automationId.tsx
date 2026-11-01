import { createFileRoute } from '@tanstack/react-router'
import {
  AutomationRuns,
  automationParams,
  loadAutomationRuns,
  RunsSearch,
} from '../../../../../builder/automations/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

// The history of one automation of a Projeto; one of the company's Início opened here is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/automations/$automationId',
)({
  staticData: { place: 'Automações' },
  params: {
    parse: (raw) => ({ ...projectParams.parse(raw), ...automationParams.parse(raw) }),
    stringify: (p) => p,
  },
  validateSearch: RunsSearch,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    loadAutomationRuns(context.queryClient, { ...params, page: deps.page }),
  errorComponent: RouteReadFailure,
  component: RunsPage,
})

function RunsPage() {
  const { companyId, projectId, automationId } = Route.useParams()
  const { page } = Route.useSearch()
  return (
    <AutomationRuns
      companyId={companyId}
      projectId={projectId}
      automationId={automationId}
      page={page}
    />
  )
}
