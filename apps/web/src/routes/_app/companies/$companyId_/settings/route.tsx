import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useMatches, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import {
  AccountMenu,
  companyEntry,
  companyQuery,
  enterHouse,
} from '../../../../../hub/identity/public.ts'
import { Frame } from '../../../../../ui/frame.tsx'
import { PageTitle } from '../../../../../ui/list.tsx'
import type { SettingsSection } from '../../../../../ui/settings-index.tsx'
import { SettingsIndex } from '../../../../../ui/settings-index.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../../../ui/sidebar.tsx'

const SETTINGS = '/_app/companies/$companyId_/settings'
const INDEX = '/_app/companies/$companyId_/settings/'

// Outside the company's frame (a route that is not nested), Configurações has its own: the index.
export const Route = createFileRoute('/_app/companies/$companyId_/settings')({
  ...companyEntry,
  beforeLoad: ({ context, params }) => enterHouse({ context, companyId: params.companyId }),
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
 * The index in the sidebar, and a section that opened under its label as the page's title. The
 * index route, only reached on a phone, shows the index itself as a list (web W32). Anything else
 * that takes the content, a not-found or a failure, stands alone in it (web W17, W34).
 */
function SettingsFrame() {
  const { companyId } = Route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const { person } = Route.useRouteContext()
  const sections = useSections()
  const { routesById } = useRouter()
  const index = <SettingsIndex sections={sections} groupName={company.name} />
  const opened = useMatches({
    select: (matches) => {
      const leaf = matches.at(-1)
      return leaf?.status === 'success' ? leaf.routeId : undefined
    },
  })
  const section = opened && routesById[opened]?.options.staticData?.section
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
      footer={<AccountMenu person={person} />}
      compact={false}
    >
      {opened === INDEX ? (
        <>
          <PageTitle className="mb-lg">Configurações</PageTitle>
          {index}
        </>
      ) : section ? (
        <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-xl">
          <div className="flex flex-col gap-xs">
            <PageTitle className="text-display-narrow">{section.label}</PageTitle>
            <p className="text-text-2">{section.summary}</p>
          </div>
          <Outlet />
        </div>
      ) : (
        <Outlet />
      )}
    </Frame>
  )
}
