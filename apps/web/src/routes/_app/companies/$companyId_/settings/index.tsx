import { createFileRoute, redirect } from '@tanstack/react-router'
import { isMobile } from '../../../../../ui/use-mobile.ts'

// On a wide screen the index is already in the sidebar, so Configurações opens the person's account;
// on a phone the frame shows the index itself (web W32).
export const Route = createFileRoute('/_app/companies/$companyId_/settings/')({
  staticData: { place: 'Configurações' },
  beforeLoad: ({ params }) => {
    if (!isMobile()) {
      throw redirect({ to: '/companies/$companyId/settings/account', params, replace: true })
    }
  },
})
