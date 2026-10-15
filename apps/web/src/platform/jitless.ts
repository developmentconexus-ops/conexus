import { config } from 'zod'

// Zod probes `new Function` when it builds its first schema, and the Hub's CSP reports that as a
// violation. The build puts this module in the chunk that holds Zod, which runs before the entry's
// body, so the switch is set before any schema exists; cache.test.tsx and vite.config.test.ts fail
// when it is not (web W27).
config({ jitless: true })
