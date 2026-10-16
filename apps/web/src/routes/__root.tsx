import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { sessionQuery } from '../hub/identity/public.ts'
import { initialActionOf } from '../platform/initial.ts'

export type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ context }) => ({
    initial: initialActionOf(await context.queryClient.ensureQueryData(sessionQuery)),
  }),
  component: Outlet,
})
