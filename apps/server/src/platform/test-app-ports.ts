import { appLogin, appLoginPassword } from '@conexus/hub-api'
import { testBuilderPorts } from '../builder/runs/test-runs.ts'
import type { CompanyPostgres } from './company-postgres.ts'
import { createCompanyPostgres } from './company-postgres.ts'
import type { Config } from './config.ts'
import { DatabaseUrl } from './database.ts'
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
  // The test server's databases are not Neon's: the read login's address is the owner's, as the
  // owner's last act on that Projeto gave it, with the login and its derived password.
  const owners = new Map<string, DatabaseUrl>()
  const companyPostgres: CompanyPostgres = {
    ensureApp(owner, projectId) {
      owners.set(projectId, owner)
      return inner.ensureApp(owner, projectId)
    },
    ensureReadLogin(owner, projectId) {
      owners.set(projectId, owner)
      return inner.ensureReadLogin(owner, projectId)
    },
    readApp: (read, sql, signal) => inner.readApp(read, sql, signal),
    async readAddress(_host, projectId) {
      const owner = owners.get(projectId)
      if (owner === undefined) throw new Error('no owner address was seen for the Projeto')
      const { readLogin } = appLogin(projectId)
      const url = new URL(owner.reveal())
      url.username = readLogin
      url.password = await appLoginPassword({ key: config.appLoginKey.reveal(), login: readLogin })
      return DatabaseUrl.parse(url.toString())
    },
    async migrate(owner, projectId, migrations) {
      owners.set(projectId, owner)
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

type Doubles = {
  neon: ReturnType<typeof fakeNeon>
  cloudflare: ReturnType<typeof fakeCloudflare>
  postgres: ReturnType<typeof heldCompanyPostgres>
  /** The saved tools' namespace (step 24.4); one of its own when the test does not look at it. */
  tools?: ReturnType<typeof fakeCloudflare>
}

/** The ports the apps reach the outside through, as doubles: Neon and Cloudflare of memory (T14). */
export function testAppPorts(
  config: Config,
  doubles: Doubles = {
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
    cloudflareTools: (doubles.tools ?? fakeCloudflare()).cloudflare,
    ...testBuilderPorts(config, machineFolder),
    log: silent,
  }
}
