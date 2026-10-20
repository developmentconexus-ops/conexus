import './platform/jitless.ts'
import './brand/tokens.css'
import { CSPProvider } from '@base-ui/react/csp-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import type { RouterHistory } from '@tanstack/react-router'
import { createRouter, RouterProvider, useRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createCache } from './platform/cache.ts'
import { HubFailure } from './platform/hub.ts'
import { applyChosenTheme } from './platform/theme.ts'
import { routeTree } from './routeTree.gen.ts'
import type { SectionMeta } from './ui/settings-index.tsx'
import { Failure, Loading, NotFound } from './ui/states.tsx'

// The router learns its routes and its static data, and the cache the `meta` a write may carry
// (web W12), by declaration merging, which needs interfaces.
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: { keepCache?: true }
  }
}
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createConexus>['router']
  }
  interface StaticDataRouteOption {
    place?: string
    /** A section of Configurações' index, in its group and order (web W32). */
    section?: SectionMeta
    /** A step of the owner's first entry, which its frame shows as "Passo n de 4" (web W33). */
    step?: 1 | 2 | 3 | 4
  }
}

function PageFailure({ error, reset }: { error: unknown; reset: () => void }) {
  const router = useRouter()
  return (
    <Failure
      code={error instanceof HubFailure ? error.code : 'INTERNAL_UNEXPECTED'}
      onRetry={() => void router.invalidate().then(reset)}
    />
  )
}

/** The router and its cache; a session that ends on any call lands on sign-in (web W15). */
export function createConexus(history?: RouterHistory) {
  const queryClient = createCache(async () => {
    const back = router.state.location.href
    await router.navigate({ to: '/login', search: { reason: 'session-ended', redirect: back } })
    queryClient.clear()
  })
  const router = createRouter({
    routeTree,
    context: { queryClient },
    ...(history ? { history } : {}),
    defaultPendingComponent: Loading,
    defaultErrorComponent: PageFailure,
    defaultNotFoundComponent: () => <NotFound />,
    defaultPendingMs: 150,
    defaultPendingMinMs: 400,
    defaultPreload: 'intent',
  })
  return { router, queryClient }
}

export function Conexus({ conexus }: { conexus: ReturnType<typeof createConexus> }) {
  return (
    <StrictMode>
      <CSPProvider disableStyleElements>
        <QueryClientProvider client={conexus.queryClient}>
          <RouterProvider router={conexus.router} />
        </QueryClientProvider>
      </CSPProvider>
    </StrictMode>
  )
}

const root = document.getElementById('root')
if (root !== null) {
  applyChosenTheme()
  createRoot(root).render(<Conexus conexus={createConexus()} />)
}
