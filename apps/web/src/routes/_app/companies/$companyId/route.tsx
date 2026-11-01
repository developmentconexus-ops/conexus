import { createFileRoute, Outlet, useMatches, useParams } from '@tanstack/react-router'
import { HouseIcon, PlugIcon, SettingsIcon } from 'lucide-react'
import { useEffect } from 'react'
import {
  AccountMenu,
  CompanySwitcher,
  companyEntry,
  enterHouse,
} from '../../../../hub/identity/public.ts'
import {
  ProjectRailHead,
  ProjectRailNav,
  projectsQuery,
  RecentProjects,
  rememberProject,
} from '../../../../hub/projects/public.ts'
import { Frame, FrameLink } from '../../../../ui/frame.tsx'
import { SidebarGroup, SidebarMenu } from '../../../../ui/sidebar.tsx'

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

/** The company's frame: inside a Projeto its sidebar is the Projeto's own (web W30). */
function HouseFrame() {
  const { companyId } = Route.useParams()
  const { person } = Route.useRouteContext()
  const projectId = useParams({ strict: false, select: (params) => params.projectId })
  useEffect(() => {
    if (projectId !== undefined) rememberProject({ personId: person.id, companyId, projectId })
  }, [person.id, companyId, projectId])
  const bounded = useMatches({ select: (matches) => matches.at(-1)?.staticData.bounded === true })
  const params = { companyId }
  return (
    <Frame
      header={
        projectId === undefined ? (
          <CompanySwitcher current={companyId} />
        ) : (
          <ProjectRailHead companyId={companyId} projectId={projectId} />
        )
      }
      nav={
        projectId !== undefined ? (
          <ProjectRailNav companyId={companyId} projectId={projectId} />
        ) : (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <FrameLink
                  to="/companies/$companyId"
                  params={params}
                  activeOptions={{ exact: true }}
                  icon={HouseIcon}
                  label="Início"
                />
              </SidebarMenu>
            </SidebarGroup>
            <RecentProjects companyId={companyId} personId={person.id} />
            <SidebarGroup>
              <SidebarMenu>
                <FrameLink
                  to="/companies/$companyId/integrations"
                  params={params}
                  icon={PlugIcon}
                  label="Integrações"
                />
              </SidebarMenu>
            </SidebarGroup>
          </>
        )
      }
      footer={
        <>
          <SidebarMenu>
            <FrameLink
              to="/companies/$companyId/settings"
              params={params}
              icon={SettingsIcon}
              label="Configurações"
            />
          </SidebarMenu>
          <AccountMenu person={person} />
        </>
      }
      compact={projectId !== undefined || bounded}
    >
      <Outlet />
    </Frame>
  )
}
