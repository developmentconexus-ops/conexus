import { appLogin, appLoginPassword } from '@conexus/hub-api'
import { createAws } from './aws.ts'
import type { CompanyPostgres } from './company-postgres.ts'
import { createCompanyPostgres } from './company-postgres.ts'
import type { Config } from './config.ts'
import { DatabaseUrl } from './database.ts'
import { fakeAws } from './test-aws.ts'
import { fakeCloudflare } from './test-cloudflare.ts'
import { pgTransport } from './test-company-postgres.ts'
import { silent } from './test-database.ts'
import { fakeNeon } from './test-neon.ts'

async function asLogin(config: Config, owner: DatabaseUrl, login: string) {
  const url = new URL(owner.reveal())
  url.username = login
  url.password = await appLoginPassword({ key: config.appLoginKey.reveal(), login })
  return DatabaseUrl.parse(url.toString())
}

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
    readApp: (read, statement, signal) => inner.readApp(read, statement, signal),
    async readAddress(_host, projectId) {
      const owner = owners.get(projectId)
      if (owner === undefined) throw new Error('no owner address was seen for the Projeto')
      return asLogin(config, owner, appLogin(projectId).readLogin)
    },
    resetCheck: (owner, projectId) => inner.resetCheck(owner, projectId),
    async migrate(owner, logins, migrations) {
      const held = holds.shift()
      if (held !== undefined) {
        held.arrived.resolve()
        await held.released.promise
      }
      return inner.migrate(owner, logins, migrations)
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
  /** The companies' lakes in AWS; one of its own when the test does not look at it. */
  aws?: ReturnType<typeof fakeAws>
}

/** The ports the apps reach the outside through, as doubles: Neon and Cloudflare of memory (T14). */
export function testAppPorts(
  config: Config,
  doubles: Doubles = {
    neon: fakeNeon(),
    cloudflare: fakeCloudflare(),
    postgres: heldCompanyPostgres(config),
  },
) {
  const copyAws = createAws({ config, log: silent })
  const memoryAws = fakeAws()
  return {
    neon: doubles.neon.neon,
    lakeStacks: (doubles.aws ?? memoryAws).aws,
    copyTasks: copyAws.tasks,
    lakeTables: (doubles.aws ?? memoryAws).tables,
    copyQueue: copyAws.queue,
    companyPostgres: doubles.postgres.companyPostgres,
    cloudflare: doubles.cloudflare.cloudflare,
    log: silent,
  }
}
