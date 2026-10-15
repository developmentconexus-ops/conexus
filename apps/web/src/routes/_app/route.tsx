import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { HouseIcon } from 'lucide-react'
import { AccountMenu, sessionQuery } from '../../hub/identity/public.ts'
import { Frame } from '../../ui/frame.tsx'

const PLACES = [{ to: '/', icon: HouseIcon, label: 'Início' }] as const

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session === null) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { person: session.person }
  },
  component: AppFrame,
})

function AppFrame() {
  const { person } = Route.useRouteContext()
  const place = useMatches({ select: (matches) => matches.at(-1)?.staticData.place })
  return (
    <Frame place={place ?? ''} places={PLACES} account={<AccountMenu person={person} />}>
      <Outlet />
    </Frame>
  )
}
