import { createFileRoute } from '@tanstack/react-router'
import {
  DataLayer,
  DataPage,
  DataReadFailure,
  DataSearch,
  loadCopies,
  manageCopiesOrNotFound,
} from '../../../../hub/copies/public.ts'
import { Loading } from '../../../../ui/states.tsx'

// The company's data, for whoever manages copies; anyone else's address is not found (web W34, S10).
// The layer and the search are in the address (web W18).
export const Route = createFileRoute('/_app/companies/$companyId/data/')({
  staticData: { place: 'Dados' },
  beforeLoad: manageCopiesOrNotFound,
  validateSearch: DataSearch,
  loader: ({ context, params }) => loadCopies(context.queryClient, params.companyId),
  pendingComponent: Loading,
  errorComponent: DataReadFailure,
  component: DataRoute,
})

function DataRoute() {
  const { companyId } = Route.useParams()
  const { layer = DataLayer.enum.raw, q } = Route.useSearch()
  return <DataPage companyId={companyId} layer={layer} q={q} />
}
