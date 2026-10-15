import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { HubFailure } from './hub.ts'

/**
 * A failed read is shown, never retried by default (code C58). A 401 on any read or write calls
 * `onSessionEnded`, so no screen handles it (web W15).
 */
export function createCache(onSessionEnded: () => void): QueryClient {
  function ended(error: Error) {
    if (error instanceof HubFailure && error.code === 'SESSION_REQUIRED') onSessionEnded()
  }
  return new QueryClient({
    queryCache: new QueryCache({ onError: ended }),
    mutationCache: new MutationCache({ onError: ended }),
    defaultOptions: { queries: { retry: false } },
  })
}
