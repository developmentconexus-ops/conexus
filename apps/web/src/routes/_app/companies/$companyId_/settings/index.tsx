import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/companies/$companyId_/settings/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/companies/$companyId/settings/account', params, replace: true })
  },
})
