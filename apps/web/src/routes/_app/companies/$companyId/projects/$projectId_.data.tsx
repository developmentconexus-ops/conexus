import { createFileRoute, Outlet } from '@tanstack/react-router'
import { appTablesQuery, DataPage } from '../../../../../hub/apps/public.ts'
import { projectParams } from '../../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { RouteReadFailure } from '../../../../../ui/states.tsx'

/** A list read this recently is not read again when the person moves between its tables. */
const LIST_FRESH_MS = 30_000

// The Dados page of a Projeto's app, beside the Construir's workbench: its list of tables, with a
// table's rows in the child route.
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/data')({
  staticData: { place: 'Dados' },
  params: projectParams,
  // The one read: a 404 of it is a Projeto, or a person, the page is not for; the rail reads the Projeto.
  loader: ({ context, params }) =>
    readOrNotFound(
      context.queryClient.fetchQuery({
        ...appTablesQuery(params.companyId, params.projectId),
        staleTime: LIST_FRESH_MS,
      }),
    ),
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
