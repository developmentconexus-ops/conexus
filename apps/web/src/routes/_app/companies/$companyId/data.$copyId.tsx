import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/companies/$companyId/data/$copyId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/companies/$companyId/data',
      params: { companyId: params.companyId },
      replace: true,
    })
  },
})
