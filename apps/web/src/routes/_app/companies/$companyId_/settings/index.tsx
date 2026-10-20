import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useIsMobile } from '../../../../../ui/use-mobile.ts'

// On a wide screen the index is already in the sidebar, so Configurações opens the person's account;
// on a phone the frame shows the index itself (web W32).
function Index() {
  const params = Route.useParams()
  if (useIsMobile()) return null
  return <Navigate to="/companies/$companyId/settings/account" params={params} replace />
}

export const Route = createFileRoute('/_app/companies/$companyId_/settings/')({
  staticData: { place: 'Configurações' },
  component: Index,
})
