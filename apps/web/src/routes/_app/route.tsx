import type { CompanyId } from '@conexus/hub-api'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { FolderIcon, HouseIcon, KeyRoundIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { AccountMenu, CompanySwitcher, sessionQuery } from '../../hub/identity/public.ts'
import { Frame } from '../../ui/frame.tsx'

const HOME = [{ to: '/', icon: HouseIcon, label: 'Início' }] as const

/** The places of a company, which the rail lists while its address is open (screen map). */
function placesOf(companyId: CompanyId) {
  const params = { companyId }
  return [
    { to: '/companies/$companyId/projects', params, icon: FolderIcon, label: 'Projetos' },
    { to: '/companies/$companyId/people', params, icon: UsersIcon, label: 'Pessoas' },
    {
      to: '/companies/$companyId/model-account',
      params,
      icon: KeyRoundIcon,
      label: 'Minha conta de modelo',
    },
    {
      to: '/companies/$companyId/setup',
      params,
      icon: SettingsIcon,
      label: 'Configurar a empresa',
    },
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
  // A page that is not found, by the page or by its company's guard, names no place and no
  // company: the Central's name is not shown to whoever it hides from, and the rail lists only the
  // places of a company that was found.
  const place = useMatches({
    select: (matches) =>
      matches.some((match) => match.status === 'notFound')
        ? undefined
        : matches.at(-1)?.staticData.place,
  })
  const companyId = useMatches({
    select: (matches) =>
      matches.some((match) => match.status === 'notFound')
        ? undefined
        : matches.find((match) => match.routeId === '/_app/companies/$companyId')?.params.companyId,
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
