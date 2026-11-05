import type { CompanyId, CompanyMay } from '@conexus/hub-api'
import { createFileRoute, Outlet, useMatches, useParams } from '@tanstack/react-router'
import { BotIcon, FolderIcon, HouseIcon, PlugIcon, SettingsIcon, TimerIcon } from 'lucide-react'
import { useEffect } from 'react'
import { NewConversation, SidebarConversations } from '../../../../builder/assistant/public.ts'
import {
  AccountMenu,
  CompanySwitcher,
  companyEntry,
  enterHouse,
} from '../../../../hub/identity/public.ts'
import { NotificationBell, unreadNote, useUnread } from '../../../../hub/notifications/public.ts'
import {
  ProjectRailHead,
  ProjectRailNav,
  projectsQuery,
  rememberProject,
} from '../../../../hub/projects/public.ts'
import { Frame } from '../../../../ui/frame.tsx'
import { SidebarGroup } from '../../../../ui/sidebar.tsx'
import { SidebarRailButton } from '../../../../ui/sidebar-rail-button.tsx'

export const Route = createFileRoute('/_app/companies/$companyId')({
  ...companyEntry,
  beforeLoad: ({ context, params }) => enterHouse({ context, companyId: params.companyId }),
  // The sidebar's recent Projects read the first page before the frame mounts, so a page's loader
  // reading it too never has its fetch cancelled by the sidebar's observer coming and going. A
  // failure here is the sidebar's to show: its group goes away.
  loader: ({ context, params }) =>
    context.queryClient.prefetchQuery(projectsQuery(params.companyId, undefined)),
  component: HouseFrame,
})

/** The rail's places at the top: Automações follows Integrações and Agentes follows it, each for whoever the Hub says may. */
function RailPlaces(props: { companyId: CompanyId; may: CompanyMay }) {
  const { companyId, may } = props
  const inInicio = useMatches({
    select: (matches) => matches.at(-1)?.staticData.place === 'Início',
  })
  const params = { companyId }
  return (
    <>
      <SidebarRailButton
        to="/companies/$companyId"
        params={params}
        icon={HouseIcon}
        label="Início"
        activeOptions={{ exact: true }}
        alsoCurrent={inInicio}
      />
      <SidebarRailButton
        to="/companies/$companyId/projects"
        params={params}
        icon={FolderIcon}
        label="Projetos"
      />
      <SidebarRailButton
        to="/companies/$companyId/integrations"
        params={params}
        icon={PlugIcon}
        label="Integrações"
      />
      {may.manageAutomations && (
        <SidebarRailButton
          to="/companies/$companyId/automations"
          params={params}
          icon={TimerIcon}
          label="Automações"
        />
      )}
      {may.manageAgents && (
        <SidebarRailButton
          to="/companies/$companyId/agents"
          params={params}
          icon={BotIcon}
          label="Agentes"
        />
      )}
    </>
  )
}

/** The company's frame: the rail of places, and beside it the list, which inside a Projeto is the Projeto's own (web W30). */
function HouseFrame() {
  const { companyId } = Route.useParams()
  const { person, may } = Route.useRouteContext()
  const projectId = useParams({ strict: false, select: (params) => params.projectId })
  useEffect(() => {
    if (projectId !== undefined) rememberProject({ personId: person.id, companyId, projectId })
  }, [person.id, companyId, projectId])
  const bounded = useMatches({ select: (matches) => matches.at(-1)?.staticData.bounded === true })
  const menuNote = unreadNote(useUnread(companyId))
  const foot = (
    <>
      <SidebarRailButton
        to="/companies/$companyId/settings"
        params={{ companyId }}
        icon={SettingsIcon}
        label="Configurações"
      />
      <NotificationBell companyId={companyId} />
      <AccountMenu person={person} compact />
    </>
  )
  return (
    <Frame
      header={
        projectId === undefined ? (
          <CompanySwitcher current={companyId} />
        ) : (
          <ProjectRailHead companyId={companyId} projectId={projectId} />
        )
      }
      rail={{ top: <RailPlaces companyId={companyId} may={may} />, foot }}
      menuNote={menuNote}
      nav={
        projectId !== undefined ? (
          <ProjectRailNav companyId={companyId} projectId={projectId} />
        ) : (
          <SidebarGroup>
            <NewConversation companyId={companyId} />
            <SidebarConversations companyId={companyId} />
          </SidebarGroup>
        )
      }
      compact={projectId !== undefined || bounded}
    >
      <Outlet />
    </Frame>
  )
}
