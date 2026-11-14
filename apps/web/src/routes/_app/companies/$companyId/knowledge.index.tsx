import { createFileRoute } from '@tanstack/react-router'
import { Knowledge, KnowledgeSearch, loadKnowledge } from '../../../../hub/ontology/public.ts'
import { Loading, RouteReadFailure } from '../../../../ui/states.tsx'

// Conhecimento, for every member (no permission in `beforeLoad`): the tab is in the address (web W17, W18).
export const Route = createFileRoute('/_app/companies/$companyId/knowledge/')({
  staticData: { place: 'Conhecimento' },
  validateSearch: KnowledgeSearch,
  loader: ({ context, params }) => loadKnowledge(context.queryClient, params.companyId),
  pendingComponent: Loading,
  errorComponent: RouteReadFailure,
  component: KnowledgePage,
})

function KnowledgePage() {
  const { companyId } = Route.useParams()
  const { aba } = Route.useSearch()
  return <Knowledge companyId={companyId} tab={aba ?? 'conceitos'} />
}
