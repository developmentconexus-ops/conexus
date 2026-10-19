import type { CompanyId, Role } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Outlet, redirect, useMatches } from '@tanstack/react-router'
import { FolderIcon, HouseIcon, KeyRoundIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import {
  AccountMenu,
  CompanySwitcher,
  companyQuery,
  sessionQuery,
} from '../../hub/identity/public.ts'
import { Frame } from '../../ui/frame.tsx'

const HOME = [{ to: '/', icon: HouseIcon, label: 'Início' }] as const

/**
 * The places of a company, which the rail lists while its address is open (screen map). Its
 * settings are for an owner or an administrator.
 */
function placesOf(companyId: CompanyId, role: Role) {
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
    ...(role === 'member'
      ? []
      : [
          {
            to: '/companies/$companyId/setup',
            params,
            icon: SettingsIcon,
            label: 'Configurar a empresa',
          } as const,
        ]),
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
  if (companyId === undefined) {
    return (
      <Frame place={place ?? ''} places={HOME} account={<AccountMenu person={person} />}>
        <Outlet />
      </Frame>
    )
  }
  return <CompanyFrame companyId={companyId} place={place ?? ''} person={person} />
}

/** The frame of a company's page: its rail follows the role the Hub gave the person there. */
function CompanyFrame(props: {
  companyId: CompanyId
  place: string
  person: ComponentProps<typeof AccountMenu>['person']
}) {
  const { role } = useSuspenseQuery(companyQuery(props.companyId)).data
  return (
    <Frame
      place={props.place}
      places={placesOf(props.companyId, role)}
      switcher={<CompanySwitcher current={props.companyId} />}
      account={<AccountMenu person={props.person} />}
    >
      <Outlet />
    </Frame>
  )
}
