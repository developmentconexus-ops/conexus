import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { HouseIcon, SettingsIcon } from 'lucide-react'
import { useEffect } from 'react'
import {
  AccountMenu,
  CompanySwitcher,
  companyParams,
  enterCompany,
  rememberCompany,
} from '../../../../hub/identity/public.ts'
import { projectsQuery, RecentProjects, rememberProject } from '../../../../hub/projects/public.ts'
import { Frame, FrameLink } from '../../../../ui/frame.tsx'
import { SidebarGroup, SidebarMenu } from '../../../../ui/sidebar.tsx'

const PROJECT = '/_app/companies/$companyId/projects/$projectId'

export const Route = createFileRoute('/_app/companies/$companyId')({
  params: companyParams,
  beforeLoad: ({ context, params }) =>
    enterCompany({ context, companyId: params.companyId, frame: 'house' }),
  // The company opened last is the one "/" opens next time, in this browser (web W30).
  onEnter: ({ context, params }) => rememberCompany(context.person.id, params.companyId),
  // The switch only changes the company in the address, which the router calls staying.
  onStay: ({ context, params }) => rememberCompany(context.person.id, params.companyId),
  // The sidebar's recent Projects read the first page before the frame mounts, so a page's loader
  // reading it too never has its fetch cancelled by the sidebar's observer coming and going. A
  // failure here is the sidebar's to show: its group goes away.
  loader: ({ context, params }) =>
    context.queryClient.prefetchQuery(projectsQuery(params.companyId, undefined)),
  component: HouseFrame,
})

/** The company's frame: its sidebar closes to icons inside a Projeto (web W30). */
function HouseFrame() {
  const { companyId } = Route.useParams()
  const { person } = Route.useRouteContext()
  const place = useMatches({ select: (matches) => matches.at(-1)?.staticData.place ?? '' })
  const projectId = useMatches({
    select: (matches) => matches.find((match) => match.routeId === PROJECT)?.params.projectId,
  })
  useEffect(() => {
    if (projectId !== undefined) rememberProject({ personId: person.id, companyId, projectId })
  }, [person.id, companyId, projectId])
  const params = { companyId }
  return (
    <Frame
      header={<CompanySwitcher current={companyId} />}
      nav={
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
        </>
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
      place={place}
      compact={projectId !== undefined}
    >
      <Outlet />
    </Frame>
  )
}
