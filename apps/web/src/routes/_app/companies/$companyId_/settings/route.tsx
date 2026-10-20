import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useMatches, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { companyEntry, companyQuery } from '../../../../../hub/identity/public.ts'
import { Frame } from '../../../../../ui/frame.tsx'
import { PageTitle } from '../../../../../ui/list.tsx'
import type { SettingsSection } from '../../../../../ui/settings-index.tsx'
import { SettingsIndex } from '../../../../../ui/settings-index.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../../../ui/sidebar.tsx'

const SETTINGS = '/_app/companies/$companyId_/settings'

// Outside the company's frame (a route that is not nested), Configurações has its own: the index.
export const Route = createFileRoute('/_app/companies/$companyId_/settings')({
  ...companyEntry('house'),
  component: SettingsFrame,
})

/**
 * Each child route with `staticData.section` is a section of the index, in its group and order: a
 * new section is one more file (web W32).
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
    .map(({ route, section }) => ({ to: route.fullPath, params: { companyId }, ...section }))
}

/**
 * The index in the sidebar, and the open section under its label as the page's title. The index
 * route has no section: on a phone it shows the index itself, as a list (web W32).
 */
function SettingsFrame() {
  const { companyId } = Route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const sections = useSections()
  const index = <SettingsIndex sections={sections} groupName={company.name} />
  const title = useMatches({ select: (matches) => matches.at(-1)?.staticData.section?.label })
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
      nav={index}
      footer={null}
      compact={false}
    >
      {title === undefined ? (
        <>
          <PageTitle className="mb-lg">Configurações</PageTitle>
          {index}
          <Outlet />
        </>
      ) : (
        <div className="flex flex-col gap-xl">
          <PageTitle>{title}</PageTitle>
          <Outlet />
        </div>
      )}
    </Frame>
  )
}
