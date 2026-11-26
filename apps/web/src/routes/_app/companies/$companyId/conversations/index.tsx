import { createFileRoute } from '@tanstack/react-router'
import { ConversationsPage, ConversationsSearch } from '../../../../../agents/assistant/public.ts'

function Conversations() {
  const { companyId } = Route.useParams()
  return <ConversationsPage companyId={companyId} />
}

export const Route = createFileRoute('/_app/companies/$companyId/conversations/')({
  staticData: { place: 'Conversas' },
  validateSearch: ConversationsSearch.catch({}),
  component: Conversations,
})
