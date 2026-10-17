import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// The shared self-hosted runners contend for CPU, past the 1 s default wait; testTimeout still catches a hang.
configure({ asyncUtilTimeout: 5000 })

afterEach(cleanup)
