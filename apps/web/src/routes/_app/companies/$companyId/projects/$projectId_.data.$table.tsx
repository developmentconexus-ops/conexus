import { listAppRows } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { appRowsQuery, DataRows, RowsFailure, tableParams } from '../../../../../hub/apps/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { Loading, NotFound } from '../../../../../ui/states.tsx'

// A table's rows, a page at a time, the page in the address (web W18); each read is fresh (web W12).
export const Route = createFileRoute('/_app/companies/$companyId/projects/$projectId_/data/$table')(
  {
    staticData: { place: 'Dados' },
    params: tableParams,
    validateSearch: listAppRows.input.query.catch({}),
    loaderDeps: ({ search }) => ({ page: search.page }),
    loader: ({ context, params, deps }) =>
      readOrNotFound(
        context.queryClient.fetchQuery(
          appRowsQuery(params.companyId, params.projectId, params.table, deps.page),
        ),
      ),
    pendingComponent: Loading,
    errorComponent: RowsFailure,
    notFoundComponent: () => <NotFound />,
    component: Rows,
  },
)

function Rows() {
  const { companyId, projectId, table } = Route.useParams()
  const { page } = Route.useSearch()
  return <DataRows companyId={companyId} projectId={projectId} table={table} page={page} />
}
