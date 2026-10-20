import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// The shared self-hosted runners contend for CPU, past the 1 s default wait; testTimeout still catches a hang.
configure({ asyncUtilTimeout: 5000 })

afterEach(cleanup)

// jsdom lays nothing out and has no ResizeObserver, which the Projeto's divider needs to mount; the
// widths are proved in the real browser (layout.test.ts).
class NoLayoutObserver {
  observe = () => undefined
  unobserve = () => undefined
  disconnect = () => undefined
}
globalThis.ResizeObserver ??= NoLayoutObserver
