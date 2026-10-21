import { testBuilderPorts } from '../builder/runs/test-runs.ts'
import type { CompanyPostgres } from './company-postgres.ts'
import { createCompanyPostgres } from './company-postgres.ts'
import type { Config } from './config.ts'
import { fakeCloudflare } from './test-cloudflare.ts'
import { pgTransport } from './test-company-postgres.ts'
import { silent } from './test-database.ts'
import { fakeNeon } from './test-neon.ts'

/**
 * The company's database on the test server (T19), whose next migration can be kept before it runs,
 * so a test can act between a send's last check and its end. Its methods can be mocked one by one.
 */
export function heldCompanyPostgres(config: Config) {
  const inner = createCompanyPostgres({ transport: pgTransport, appLoginKey: config.appLoginKey })
  const holds: { arrived: PromiseWithResolvers<void>; released: PromiseWithResolvers<void> }[] = []
  const companyPostgres: CompanyPostgres = {
    ensureApp: (owner, projectId) => inner.ensureApp(owner, projectId),
    async migrate(owner, projectId, migrations) {
      const held = holds.shift()
      if (held !== undefined) {
        held.arrived.resolve()
        await held.released.promise
      }
      return inner.migrate(owner, projectId, migrations)
    },
    dropApp: (owner, projectId) => inner.dropApp(owner, projectId),
  }
  return {
    companyPostgres,
    /** Keeps the next migration before it runs; `arrived` resolves when it is waiting. */
    holdMigrate() {
      const held = {
        arrived: Promise.withResolvers<void>(),
        released: Promise.withResolvers<void>(),
      }
      holds.push(held)
      return { arrived: held.arrived.promise, release: () => held.released.resolve() }
    },
  }
}

/** The ports the apps reach the outside through, as doubles: Neon and Cloudflare of memory (T14). */
export function testAppPorts(
  config: Config,
  doubles = {
    neon: fakeNeon(),
    cloudflare: fakeCloudflare(),
    postgres: heldCompanyPostgres(config),
  },
  machineFolder?: string,
) {
  return {
    neon: doubles.neon.neon,
    companyPostgres: doubles.postgres.companyPostgres,
    cloudflare: doubles.cloudflare.cloudflare,
    ...testBuilderPorts(config, machineFolder),
    log: silent,
  }
}
