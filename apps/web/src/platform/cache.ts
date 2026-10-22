import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { HubFailure } from './hub.ts'

/**
 * After a write every query is stale, except where the write's `meta` says `keepCache` (web W12).
 * A write that failed is no exception: an invitation whose e-mail failed stays in the list, and
 * the failure table cannot tell which refusals left a change behind. A 401 is: the session
 * handler drops the cache.
 * A failed read is shown, never retried by default (the library repeats it three times in the
 * browser). A 401 on any read or write calls `onSessionEnded`, so no screen handles it (web W15).
 */
export function createCache(onSessionEnded: () => void): QueryClient {
  function isSessionEnded(error: Error | null) {
    return error instanceof HubFailure && error.code === 'SESSION_REQUIRED'
  }
  function ended(error: Error) {
    if (isSessionEnded(error)) onSessionEnded()
  }
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: ended }),
    mutationCache: new MutationCache({
      onError: ended,
      onSettled: (_data, error, _variables, _context, mutation) =>
        mutation.meta?.keepCache === true || isSessionEnded(error)
          ? undefined
          : client.invalidateQueries(),
    }),
    defaultOptions: { queries: { retry: false } },
  })
  return client
}
