import { createFileRoute } from '@tanstack/react-router'
import {
  CopyDetail,
  copyParams,
  loadCopyRuns,
  manageCopiesOrNotFound,
  TableSearch,
} from '../../../../hub/copies/public.ts'
import { NotFound, RouteReadFailure } from '../../../../ui/states.tsx'

// One table of the data and its tab, with the runs a page at a time, in the address (web W18); a
// copy that does not exist, or anyone else's address, is not found (web W34, S10).
export const Route = createFileRoute('/_app/companies/$companyId/data/$copyId')({
  staticData: { place: 'Dados' },
  beforeLoad: manageCopiesOrNotFound,
  params: copyParams,
  validateSearch: TableSearch,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    loadCopyRuns(context.queryClient, { ...params, page: deps.page }),
  notFoundComponent: () => <NotFound />,
  errorComponent: RouteReadFailure,
  component: TablePage,
})

function TablePage() {
  const { companyId, copyId } = Route.useParams()
  const { tab, page } = Route.useSearch()
  const { may } = Route.useRouteContext()
  return (
    <CopyDetail
      companyId={companyId}
      copyId={copyId}
      tab={tab}
      page={page}
      mayReadRows={may.readCopyRows}
    />
  )
}
