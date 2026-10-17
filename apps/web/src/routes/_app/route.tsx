import type { CompanyId } from '@conexus/hub-api'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { FolderIcon, HouseIcon, UsersIcon } from 'lucide-react'
import { AccountMenu, CompanySwitcher, sessionQuery } from '../../hub/identity/public.ts'
import { Frame } from '../../ui/frame.tsx'

const HOME = [{ to: '/', icon: HouseIcon, label: 'Início' }] as const

/** The places of a company, which the rail lists while its address is open (screen map). */
function placesOf(companyId: CompanyId) {
  const params = { companyId }
  return [
    { to: '/companies/$companyId/projects', params, icon: FolderIcon, label: 'Projetos' },
    { to: '/companies/$companyId/people', params, icon: UsersIcon, label: 'Pessoas' },
  ] as const
}

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
  const companyId = useMatches({
    select: (matches) =>
      matches.find((match) => match.routeId === '/_app/companies/$companyId')?.params.companyId,
  })
  return (
    <Frame
      place={place ?? ''}
      places={companyId === undefined ? HOME : placesOf(companyId)}
      switcher={companyId === undefined ? undefined : <CompanySwitcher current={companyId} />}
      account={<AccountMenu person={person} />}
    >
      <Outlet />
    </Frame>
  )
}
