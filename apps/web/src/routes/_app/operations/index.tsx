import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/operations/')({
  beforeLoad: () => {
    throw redirect({ to: '/operations/clients', replace: true })
  },
})
