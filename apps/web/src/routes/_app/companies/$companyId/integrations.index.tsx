import { createFileRoute } from '@tanstack/react-router'
import { connectionsQuery, Integrations } from '../../../../hub/connectors/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../ui/states.tsx'

export const Route = createFileRoute('/_app/companies/$companyId/integrations/')({
  staticData: { place: 'Integrações' },
  loader: ({ context, params }) =>
    readOrNotFound(context.queryClient.ensureQueryData(connectionsQuery(params.companyId))),
  errorComponent: RouteReadFailure,
  component: Integrations,
})
