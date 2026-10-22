import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { Home } from '@/routes/home'

const rootRoute = createRootRoute({
  component: () => (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-6">
      <Outlet />
    </main>
  ),
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })

export const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute]) })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
