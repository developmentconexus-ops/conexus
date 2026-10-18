import { createCompanyPostgres } from './company-postgres.ts'
import type { Config } from './config.ts'
import { fakeCloudflare } from './test-cloudflare.ts'
import { pgTransport } from './test-company-postgres.ts'
import { silent } from './test-database.ts'
import { fakeNeon } from './test-neon.ts'

/** The ports the apps reach the outside through, as doubles: Neon and Cloudflare of memory (T14). */
export function testAppPorts(
  config: Config,
  doubles = { neon: fakeNeon(), cloudflare: fakeCloudflare() },
) {
  return {
    neon: doubles.neon.neon,
    companyPostgres: createCompanyPostgres({
      transport: pgTransport,
      appLoginKey: config.appLoginKey,
    }),
    cloudflare: doubles.cloudflare.cloudflare,
    log: silent,
  }
}
