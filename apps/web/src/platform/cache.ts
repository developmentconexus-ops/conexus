import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { HubFailure } from './hub.ts'

/**
 * After a write every query is stale, except where the write's `meta` says `keepCache` (web W12).
 * A failed read is shown, never retried by default (code C58). A 401 on any read or write calls
 * `onSessionEnded`, so no screen handles it (web W15).
 */
export function createCache(onSessionEnded: () => void): QueryClient {
  function ended(error: Error) {
    if (error instanceof HubFailure && error.code === 'SESSION_REQUIRED') onSessionEnded()
  }
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: ended }),
    mutationCache: new MutationCache({
      onError: ended,
      onSuccess: (_data, _variables, _context, mutation) =>
        mutation.meta?.keepCache === true ? undefined : client.invalidateQueries(),
    }),
    defaultOptions: { queries: { retry: false } },
  })
  return client
}
