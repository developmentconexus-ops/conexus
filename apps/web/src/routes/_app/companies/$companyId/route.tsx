import type { CompanyId } from '@conexus/hub-api'
import { createFileRoute, Outlet, useLocation, useMatches, useParams } from '@tanstack/react-router'
import { FolderIcon, HouseIcon, PlugIcon, SettingsIcon, TimerIcon } from 'lucide-react'
import { useEffect } from 'react'
import { NewConversation, SidebarConversations } from '../../../../builder/assistant/public.ts'
import {
  AccountMenu,
  CompanySwitcher,
  companyEntry,
  enterHouse,
} from '../../../../hub/identity/public.ts'
import { NotificationBell } from '../../../../hub/notifications/public.ts'
import {
  ProjectRailHead,
  ProjectRailNav,
  projectsQuery,
  RecentProjects,
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

/** Which place of the rail the address is in (web W30); Início holds the Assistant's conversations. */
function useCurrentPlace(companyId: string) {
  const { pathname } = useLocation()
  function inside(segment: string) {
    return pathname.startsWith(`/companies/${companyId}/${segment}`)
  }
  return {
    inicio: pathname === `/companies/${companyId}` || inside('conversations'),
    projetos: inside('projects'),
    integracoes: inside('integrations'),
    automacoes: inside('automations'),
  }
}

/** The rail's places at the top: Automações follows Integrações and is for whoever may ask the Assistant. */
function RailPlaces(props: { companyId: CompanyId; role: string }) {
  const { companyId } = props
  const current = useCurrentPlace(companyId)
  const params = { companyId }
  return (
    <>
      <SidebarRailButton
        to="/companies/$companyId"
        params={params}
        icon={HouseIcon}
        label="Início"
        current={current.inicio}
      />
      <SidebarRailButton
        to="/companies/$companyId/projects"
        params={params}
        icon={FolderIcon}
        label="Projetos"
        current={current.projetos}
      />
      <SidebarRailButton
        to="/companies/$companyId/integrations"
        params={params}
        icon={PlugIcon}
        label="Integrações"
        current={current.integracoes}
      />
      {props.role !== 'member' && (
        <SidebarRailButton
          to="/companies/$companyId/automations"
          params={params}
          icon={TimerIcon}
          label="Automações"
          current={current.automacoes}
        />
      )}
    </>
  )
}

/** The company's frame: the rail of places, and beside it the list, which inside a Projeto is the Projeto's own (web W30). */
function HouseFrame() {
  const { companyId } = Route.useParams()
  const { person, role } = Route.useRouteContext()
  const projectId = useParams({ strict: false, select: (params) => params.projectId })
  useEffect(() => {
    if (projectId !== undefined) rememberProject({ personId: person.id, companyId, projectId })
  }, [person.id, companyId, projectId])
  const bounded = useMatches({ select: (matches) => matches.at(-1)?.staticData.bounded === true })
  const foot = (
    <>
      <SidebarRailButton
        to="/companies/$companyId/settings"
        params={{ companyId }}
        icon={SettingsIcon}
        label="Configurações"
        current={false}
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
      rail={{ top: <RailPlaces companyId={companyId} role={role} />, foot }}
      nav={
        projectId !== undefined ? (
          <ProjectRailNav companyId={companyId} projectId={projectId} />
        ) : role === 'member' ? (
          <RecentProjects companyId={companyId} personId={person.id} />
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
