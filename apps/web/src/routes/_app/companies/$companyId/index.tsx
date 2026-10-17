import { createFileRoute, redirect } from '@tanstack/react-router'

// A company's address opens its Projects (screen map, D2).
export const Route = createFileRoute('/_app/companies/$companyId/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/companies/$companyId/projects', params, replace: true })
  },
})
