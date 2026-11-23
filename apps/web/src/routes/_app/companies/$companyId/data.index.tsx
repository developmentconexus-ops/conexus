import { createFileRoute } from '@tanstack/react-router'
import { DataLayer, DataPage, DataSearch } from '../../../../hub/copies/public.ts'

// The company's data, its layer and the tree's search in the address (web W18).
export const Route = createFileRoute('/_app/companies/$companyId/data/')({
  staticData: { place: 'Dados' },
  validateSearch: DataSearch,
  component: DataRoute,
})

function DataRoute() {
  const { companyId } = Route.useParams()
  const { layer = DataLayer.enum.raw } = Route.useSearch()
  return <DataPage companyId={companyId} layer={layer} />
}
