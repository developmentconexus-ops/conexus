import { listCompanies } from '@conexus/hub-api'
import { createFileRoute } from '@tanstack/react-router'
import { Companies, companiesQuery, Greeting } from '../../hub/identity/public.ts'
import { StatusPage } from '../../hub/status/public.ts'

export const Route = createFileRoute('/_app/')({
  staticData: { place: 'Início' },
  validateSearch: listCompanies.input.query.catch({}),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(companiesQuery(deps.page)),
  component: HomePage,
})

function HomePage() {
  const { person } = Route.useRouteContext()
  return (
    <div className="flex flex-col gap-xl">
      <h1 className="font-display text-title">Início</h1>
      <Greeting person={person} />
      <Companies />
      <StatusPage />
    </div>
  )
}
