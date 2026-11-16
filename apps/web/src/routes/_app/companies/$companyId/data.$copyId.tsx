import { createFileRoute } from '@tanstack/react-router'
import { AskAboutTable } from '../../../../builder/assistant/public.ts'
import { CopyDetail, copyParams, loadCopyRuns, TableSearch } from '../../../../hub/copies/public.ts'
import { NotFound, RouteReadFailure } from '../../../../ui/states.tsx'

// One table of the data and its tab, with the runs a page at a time, in the address (web W18); a
// copy that does not exist, or that the person's role does not read, is not found (S10).
export const Route = createFileRoute('/_app/companies/$companyId/data/$copyId')({
  staticData: { place: 'Dados' },
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
  const { tab, page, q } = Route.useSearch()
  return (
    <CopyDetail
      companyId={companyId}
      copyId={copyId}
      tab={tab}
      page={page}
      q={q}
      ask={(table) => <AskAboutTable companyId={companyId} table={table} />}
    />
  )
}
