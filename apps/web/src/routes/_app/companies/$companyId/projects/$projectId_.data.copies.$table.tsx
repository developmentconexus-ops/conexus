import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/companies/$companyId/projects/$projectId_/data/copies/$table',
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/companies/$companyId/projects/$projectId/data',
      params: { companyId: params.companyId, projectId: params.projectId },
      replace: true,
    })
  },
})
