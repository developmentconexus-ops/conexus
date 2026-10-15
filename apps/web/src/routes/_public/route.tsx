import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Column } from '../../ui/frame.tsx'

export const Route = createFileRoute('/_public')({ component: PublicLayout })

function PublicLayout() {
  return (
    <Column>
      <Outlet />
    </Column>
  )
}
