// In the app: src/router.tsx
import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'

// A panel is one screen: the starter's frame, no sidebar, and the app opening on the dashboard. Its
// charts still load lazily, so the frame paints before recharts arrives.
const rootRoute = createRootRoute({
  component: () => (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-6">
      <Outlet />
    </main>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/painel' })
  },
})

const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/painel' }).lazy(() =>
  import('@/routes/painel.lazy').then((module) => module.dashboardLazyRoute),
)

export const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute, dashboardRoute]),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
