import { listCopyRows } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import {
  copyRowsQuery,
  DataRows,
  RowsFailure,
  tableParams,
} from '../../../../../hub/apps/public.ts'
import { readOrNotFound } from '../../../../../platform/hub.ts'
import { Loading, NotFound } from '../../../../../ui/states.tsx'

// The rows of a copy released to the Projeto, a page at a time, the page in the address (web W18);
// each read is fresh (web W12); a copy not released, or that does not exist, is not found.
export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/data/copies/$table',
)({
  staticData: { place: 'Dados' },
  params: tableParams,
  validateSearch: listCopyRows.input.query.catch({}),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    readOrNotFound(
      context.queryClient.query(
        copyRowsQuery(params.companyId, params.projectId, params.table, deps.page),
      ),
    ),
  pendingComponent: Loading,
  errorComponent: RowsFailure,
  notFoundComponent: () => <NotFound />,
  component: Rows,
})

function Rows() {
  const { companyId, projectId, table } = Route.useParams()
  const { page } = Route.useSearch()
  return (
    <DataRows schema="COPY" companyId={companyId} projectId={projectId} table={table} page={page} />
  )
}
