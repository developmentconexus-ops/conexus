import { listCompanies } from '@conexus/hub-api'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Companies, companiesQuery, Greeting } from '../../hub/identity/public.ts'
import { PageTitle } from '../../ui/list.tsx'

export const Route = createFileRoute('/_app/')({
  staticData: { place: 'Início' },
  validateSearch: listCompanies.input.query.catch({}),
  // One company and nothing more to list: its Projects open at once (screen map, D1).
  beforeLoad: async ({ context, search }) => {
    const { companies, next } = await context.queryClient.ensureQueryData(
      companiesQuery(search.page),
    )
    const [only] = companies
    if (
      only !== undefined &&
      companies.length === 1 &&
      search.page === undefined &&
      next.kind === 'END'
    ) {
      throw redirect({
        to: '/companies/$companyId/projects',
        params: { companyId: only.company.id },
      })
    }
  },
  component: HomePage,
})

function HomePage() {
  const { person } = Route.useRouteContext()
  return (
    <div className="flex flex-col gap-xl">
      <PageTitle>Início</PageTitle>
      <Greeting person={person} />
      <Companies />
    </div>
  )
}
