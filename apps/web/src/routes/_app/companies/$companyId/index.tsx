import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { accountsQuery } from '../../../../harness/model-accounts/public.ts'
import { PreparationCard } from '../../../../hub/identity/public.ts'
import { Home, ProjectsBlock } from '../../../../hub/projects/public.ts'
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
      start={<ProjectsBlock companyId={companyId} creates />}
    />
  )
}

export const Route = createFileRoute('/_app/companies/$companyId/')({
  staticData: { place: 'Início' },
  component: HomePage,
})
