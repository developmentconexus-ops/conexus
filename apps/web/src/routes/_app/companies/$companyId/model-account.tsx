import { createFileRoute, redirect } from '@tanstack/react-router'

// The old address of the person's model accounts, which a conversation still links to.
export const Route = createFileRoute('/_app/companies/$companyId/model-account')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/companies/$companyId/settings/my-model-accounts',
      params,
      replace: true,
    })
  },
})
