import { AutomationId, ProjectId } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AutomationRuns, automationsQuery } from '../../../../../builder/automations/public.ts'
import { projectQuery } from '../../../../../hub/projects/public.ts'
import { idOrNotFound, readOrNotFound } from '../../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

// The history of one automation of a Projeto; one of the company's Início opened here is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/automations/$automationId',
)({
  staticData: { place: 'Automações' },
  params: {
    parse: (raw) => ({
      projectId: idOrNotFound(ProjectId, raw.projectId),
      automationId: idOrNotFound(AutomationId, raw.automationId),
    }),
    stringify: (p) => p,
  },
  validateSearch: z.object({ page: z.string().optional().catch(undefined) }),
  loader: ({ context, params }) =>
    readOrNotFound(
      Promise.all([
        context.queryClient.ensureQueryData(projectQuery(params.companyId, params.projectId)),
        context.queryClient.ensureQueryData(automationsQuery(params.companyId, params.projectId)),
      ]),
    ),
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
