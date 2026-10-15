import { createFileRoute } from '@tanstack/react-router'
import { Greeting } from '../../hub/identity/public.ts'
import { StatusPage } from '../../hub/status/public.ts'

export const Route = createFileRoute('/_app/')({
  staticData: { place: 'Início' },
  component: HomePage,
})

function HomePage() {
  const { person } = Route.useRouteContext()
  return (
    <div className="flex flex-col gap-xl">
      <Greeting person={person} />
      <StatusPage />
    </div>
  )
}
