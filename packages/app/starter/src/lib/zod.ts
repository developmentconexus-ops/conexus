import { config } from 'zod'

// Zod probes `new Function` when it builds its first schema, and the app's CSP has no
// `unsafe-eval`, so the probe is a violation on every load. main.tsx imports this file first.
config({ jitless: true })
