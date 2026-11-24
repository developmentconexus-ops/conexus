import { listAssistantConversations } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AssistantDay, AssistantHome } from '../../../../builder/assistant/public.ts'
import { readStart } from '../../../../builder/conversation/public.ts'
import { accountsQuery } from '../../../../builder/model-accounts/public.ts'
import { PreparationCard } from '../../../../hub/identity/public.ts'
import { Home } from '../../../../hub/projects/public.ts'
import { greetingOf } from '../../../../platform/dates.ts'

/** What the company still needs, for whoever invites people (an owner or an administrator). */
function Preparation() {
  const { companyId } = Route.useParams()
  const accounts = useQuery(accountsQuery(companyId))
  if (accounts.data === undefined) return null
  return <PreparationCard companyId={companyId} companyAccounts={accounts.data.company.length} />
}

function HomePage() {
  const { companyId } = Route.useParams()
  const { mayInvite, person } = Route.useRouteContext()
  return (
    <Home
      aside={mayInvite ? <Preparation /> : undefined}
      title={greetingOf(new Date(), person.name)}
      start={<AssistantHome companyId={companyId} />}
      below={<AssistantDay companyId={companyId} />}
    />
  )
}

export const Route = createFileRoute('/_app/companies/$companyId/')({
  staticData: { place: 'Início' },
  validateSearch: z
    .object({
      conversations: listAssistantConversations.input.query.shape.page,
      q: z.string().optional(),
      place: z.string().optional(),
      tab: z.literal('projects').optional(),
    })
    .catch({}),
  loader: ({ context, params }) => readStart(context.queryClient, params.companyId),
  component: HomePage,
})
