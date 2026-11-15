import { createFileRoute, redirect } from '@tanstack/react-router'

// The page of the copies is Dados now (Dados, parte 1): the old address leads there.
export const Route = createFileRoute('/_app/companies/$companyId/copies/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/companies/$companyId/data', params, replace: true })
  },
})
