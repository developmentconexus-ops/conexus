import { randomBytes } from 'node:crypto'
import { NeonApiKey, NeonApiUrl, NeonOrgId } from './config.ts'

// Nothing listens on the discard port, so a Hub that reaches Neon without a fake server fails loudly.
export const NO_NEON_SERVER = 'http://127.0.0.1:9/api/v2'
export const TEST_NEON_ORG = 'org-test-0000'

/** The Neon part of a test configuration; the key is fresh for each call. */
export function testNeon(apiUrl = NO_NEON_SERVER) {
  return {
    neonApiUrl: NeonApiUrl.parse(apiUrl),
    neonOrgId: NeonOrgId.parse(TEST_NEON_ORG),
    neonApiKey: NeonApiKey.parse(randomBytes(16).toString('hex')),
  }
}
