import { config } from 'zod'

// Zod probes `new Function` when it builds its first schema, and the Hub's CSP reports that as a
// violation. main.tsx imports this module first, so the switch is set before any schema exists;
// cache.test.tsx fails when it is not (web W27).
config({ jitless: true })
