import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { HouseIcon } from 'lucide-react'
import { AccountMenu, sessionQuery } from '../../hub/identity/public.ts'
import { Frame } from '../../ui/frame.tsx'

const PLACES = [{ to: '/', icon: HouseIcon, label: 'Início' }] as const

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session.state === 'SIGNED_OUT') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { person: session.person }
  },
  component: AppFrame,
})

function AppFrame() {
  const { person } = Route.useRouteContext()
  // A page that is not found names no place: the Central's name is not shown to whoever it hides from.
  const place = useMatches({
    select: (matches) => {
      const last = matches.at(-1)
      return last?.status === 'notFound' ? undefined : last?.staticData.place
    },
  })
  return (
    <Frame place={place ?? ''} places={PLACES} account={<AccountMenu person={person} />}>
      <Outlet />
    </Frame>
  )
}
