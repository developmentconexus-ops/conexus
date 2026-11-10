import { appLogin, appLoginPassword } from '@conexus/hub-api'
import { testBuilderPorts } from '../builder/runs/test-runs.ts'
import type { CompanyPostgres } from './company-postgres.ts'
import { createCompanyPostgres } from './company-postgres.ts'
import type { Config } from './config.ts'
import { SYNC_LOGIN } from './copy-sql.ts'
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
  // The sync login's address likewise, by the host the Hub recorded: the test server is one host,
  // so a second company's owner on it makes the address unknown rather than another company's.
  const syncOwners = new Map<string, DatabaseUrl | 'TWO_COMPANIES'>()
  async function asLogin(owner: DatabaseUrl, login: string) {
    const url = new URL(owner.reveal())
    url.username = login
    url.password = await appLoginPassword({ key: config.appLoginKey.reveal(), login })
    return DatabaseUrl.parse(url.toString())
  }
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
      return asLogin(owner, appLogin(projectId).readLogin)
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
    ensureSync(owner) {
      const host = new URL(owner.reveal()).hostname
      const seen = syncOwners.get(host)
      const same =
        seen === undefined || (seen !== 'TWO_COMPANIES' && seen.reveal() === owner.reveal())
      syncOwners.set(host, same ? owner : 'TWO_COMPANIES')
      return inner.ensureSync(owner)
    },
    ensureCopyTable: (sync, table) => inner.ensureCopyTable(sync, table),
    async syncAddress(host) {
      const owner = syncOwners.get(host)
      if (owner === undefined || owner === 'TWO_COMPANIES') {
        throw new Error(`the sync login's address on the test host is ${owner ?? 'unseen'}`)
      }
      return asLogin(owner, SYNC_LOGIN)
    },
    writePage: (sync, input, signal) => inner.writePage(sync, input, signal),
    closePass: (sync, input, signal) => inner.closePass(sync, input, signal),
    grantCopy: (sync, input) => inner.grantCopy(sync, input),
    revokeCopy: (sync, input) => inner.revokeCopy(sync, input),
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
