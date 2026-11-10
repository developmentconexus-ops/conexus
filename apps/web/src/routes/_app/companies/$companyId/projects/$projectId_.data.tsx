import { createFileRoute, Outlet } from '@tanstack/react-router'
import { appTablesQuery, DataPage } from '../../../../../hub/apps/public.ts'
import { projectParams, projectQuery } from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

/** A list read this recently is not read again when the person moves between its tables. */
const LIST_FRESH_MS = 30_000

// The Dados page of a Projeto's app, beside the Construir's workbench: its list of tables, with a
// table's rows in the child route.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/data')({
  staticData: { place: 'Dados' },
  params: projectParams,
  loader: ({ context, params }) => {
    const { queryClient } = context
    const { companyId, projectId } = params
    return readOrNotFound(
      Promise.all([
        queryClient.ensureQueryData(projectQuery(companyId, projectId)),
        queryClient.fetchQuery({
          ...appTablesQuery(companyId, projectId),
          staleTime: LIST_FRESH_MS,
        }),
      ]),
    )
  },
  errorComponent: RouteReadFailure,
  component: Data,
})

function Data() {
  const { companyId, projectId } = Route.useParams()
  return (
    <DataPage companyId={companyId} projectId={projectId}>
      <Outlet />
    </DataPage>
  )
}
