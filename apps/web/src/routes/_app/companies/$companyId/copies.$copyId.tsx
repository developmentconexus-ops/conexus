import { createFileRoute } from '@tanstack/react-router'
import {
  CopyDetail,
  CopyRunsSearch,
  copyParams,
  loadCopyRuns,
  manageCopiesOrNotFound,
} from '../../../../hub/copies/public.ts'
import { NotFound, RouteReadFailure } from '../../../../ui/states.tsx'

// One copy and its runs, a page at a time in the address (web W18); a copy that does not exist, or
// anyone else's address, is not found (web W34, S10).
export const Route = createFileRoute('/_app/companies/$companyId/copies/$copyId')({
  staticData: { place: 'Cópias' },
  beforeLoad: manageCopiesOrNotFound,
  params: copyParams,
  validateSearch: CopyRunsSearch,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, params, deps }) =>
    loadCopyRuns(context.queryClient, { ...params, page: deps.page }),
  notFoundComponent: () => <NotFound />,
  errorComponent: RouteReadFailure,
  component: CopyPage,
})

function CopyPage() {
  const { companyId, copyId } = Route.useParams()
  const { page } = Route.useSearch()
  return <CopyDetail companyId={companyId} copyId={copyId} page={page} />
}
