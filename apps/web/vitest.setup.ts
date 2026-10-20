import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// The shared self-hosted runners contend for CPU, past the 1 s default wait; testTimeout still catches a hang.
configure({ asyncUtilTimeout: 5000 })

afterEach(cleanup)

// jsdom has no matchMedia; the frame reads it for the phone's drawer, and a test screen is wide.
globalThis.matchMedia ??= (query: string) =>
  Object.assign(new EventTarget(), {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
  })
