import { QueryClient } from '@tanstack/react-query'
import { config } from 'zod'

// Zod probes `new Function` when it builds its first schema, and the Hub's CSP reports that as a
// violation. This module must be the first one main.tsx imports, so the switch is set before any
// schema exists.
config({ jitless: true })

/** A failed read is shown, never retried by default (code C58). */
export function createCache(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}
