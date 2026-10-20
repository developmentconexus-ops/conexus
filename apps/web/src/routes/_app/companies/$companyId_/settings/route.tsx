import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useMatches, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import {
  companyParams,
  companyQuery,
  enterCompany,
  rememberCompany,
} from '../../../../../hub/identity/public.ts'
import { Frame } from '../../../../../ui/frame.tsx'
import type { SettingsSection } from '../../../../../ui/settings-index.tsx'
import { SettingsIndex } from '../../../../../ui/settings-index.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../../../ui/sidebar.tsx'

const SETTINGS = '/_app/companies/$companyId_/settings'

// Outside the company's frame (a route that is not nested), Configurações has its own: the index.
export const Route = createFileRoute('/_app/companies/$companyId_/settings')({
  params: companyParams,
  beforeLoad: ({ context, params }) =>
    enterCompany({ context, companyId: params.companyId, frame: 'house' }),
  onEnter: ({ context, params }) => rememberCompany(context.person.id, params.companyId),
  // The switch only changes the company in the address, which the router calls staying.
  onStay: ({ context, params }) => rememberCompany(context.person.id, params.companyId),
  component: SettingsFrame,
})

/**
 * Each child route with `staticData.section` is a section of the index, in its group and order: a
 * new section is one more file (step 12.2).
 */
function useSections(): SettingsSection[] {
  const { companyId } = Route.useParams()
  const { routesById } = useRouter()
  return Object.values(routesById)
    .flatMap((route) => {
      const section = route.options.staticData?.section
      return route.parentRoute?.id === SETTINGS && section ? [{ route, section }] : []
    })
    .sort((a, b) => a.section.order - b.section.order)
    .map(({ route, section }) => ({
      to: route.fullPath,
      params: { companyId },
      label: section.label,
      group: section.group,
      keywords: section.keywords ?? [],
    }))
}

function SettingsFrame() {
  const { companyId } = Route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const sections = useSections()
  const place = useMatches({ select: (matches) => matches.at(-1)?.staticData.place ?? '' })
  return (
    <Frame
      header={
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Voltar"
              render={<Link to="/companies/$companyId" params={{ companyId }} />}
            >
              <ArrowLeftIcon aria-hidden="true" />
              <span>Voltar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      }
      nav={<SettingsIndex sections={sections} groupName={company.name} />}
      footer={null}
      place={place}
      compact={false}
    >
      <Outlet />
    </Frame>
  )
}
