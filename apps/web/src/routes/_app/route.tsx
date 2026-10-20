import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQuery } from '../../hub/identity/public.ts'

// The session's entry for every page that needs one (web W15); each floor draws its own frame.
export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery)
    if (session.state === 'SIGNED_OUT') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { person: session.person }
  },
  component: Outlet,
})
