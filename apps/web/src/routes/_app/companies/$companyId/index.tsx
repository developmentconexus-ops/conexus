import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Start } from '../../../../builder/conversation/public.ts'
import { accountsQuery } from '../../../../builder/model-accounts/public.ts'
import { PreparationCard } from '../../../../hub/identity/public.ts'
import { Home, projectsQuery } from '../../../../hub/projects/public.ts'
import { readOrNotFound } from '../../../../platform/hub.ts'

/** What the company still needs, for an owner or an administrator; a member never sees it. */
function Preparation() {
  const { companyId } = Route.useParams()
  const accounts = useQuery(accountsQuery(companyId))
  if (accounts.data === undefined) return null
  return <PreparationCard companyId={companyId} companyAccounts={accounts.data.company.length} />
}

function HomePage() {
  const { companyId } = Route.useParams()
  const { role } = Route.useRouteContext()
  return (
    <Home
      companyId={companyId}
      aside={role === 'member' ? undefined : <Preparation />}
      start={<Start companyId={companyId} />}
    />
  )
}

export const Route = createFileRoute('/_app/companies/$companyId/')({
  staticData: { place: 'Início' },
  loader: ({ context, params }) =>
    readOrNotFound(
      Promise.all([
        context.queryClient.ensureQueryData(projectsQuery(params.companyId, undefined)),
        context.queryClient.ensureQueryData(accountsQuery(params.companyId)),
      ]),
    ),
  component: HomePage,
})
