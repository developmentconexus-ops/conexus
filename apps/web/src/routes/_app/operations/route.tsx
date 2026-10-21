import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ActivityIcon, UsersIcon } from 'lucide-react'
import { AccountMenu } from '../../../hub/identity/public.ts'
import { CentralHeader, operatorOnly } from '../../../hub/operations/public.ts'
import { Frame, FrameLink } from '../../../ui/frame.tsx'
import { SidebarGroup, SidebarMenu } from '../../../ui/sidebar.tsx'

/** The Central's frame, with its own sidebar; to anyone but the operator it is not found (S11). */
export const Route = createFileRoute('/_app/operations')({
  beforeLoad: operatorOnly,
  component: CentralFrame,
})

function CentralFrame() {
  const { person } = Route.useRouteContext()
  return (
    <Frame
      header={<CentralHeader />}
      nav={
        <SidebarGroup>
          <SidebarMenu>
            <FrameLink to="/operations/clients" icon={UsersIcon} label="Clientes" />
            <FrameLink to="/operations/status" icon={ActivityIcon} label="Estado do Hub" />
          </SidebarMenu>
        </SidebarGroup>
      }
      footer={<AccountMenu person={person} />}
      compact={false}
    >
      <Outlet />
    </Frame>
  )
}
