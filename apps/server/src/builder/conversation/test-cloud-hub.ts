import { readFileSync } from 'node:fs'
import type { TestContext } from 'node:test'
import { parseEnv } from 'node:util'
import { AppVersionId, appCheckWorkerOf, appWorkerOf, CompanyId, ProjectId } from '@conexus/hub-api'
import { createE2bApi, createE2bKit, createMachines, MARK } from '../../harness/machine/public.ts'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { ANA_OWNER, hubWithLog, personOn, plantCompany } from '../../hub/identity/test-hub.ts'
import { createCloudflareApps } from '../../platform/cloudflare.ts'
import { createCompanyPostgres, neonTransport } from '../../platform/company-postgres.ts'
import type { Config } from '../../platform/config.ts'
import { readConfig } from '../../platform/config.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { listenQuietly } from '../../platform/lifecycle.ts'
import { createNeonProjects } from '../../platform/neon.ts'
import { CLOUD_ENV_FILE, claudeSubscribed } from '../assistant/test-real-model.ts'
import { openRepository } from '../git/public.ts'

/** The installation's settings the conference reaches the providers with; the rest stays the test Hub's. */
type Cloud = Pick<
  Config,
  | 'edgePort'
  | 'appsDomain'
  | 'appLoginKey'
  | 'neonApiUrl'
  | 'neonOrgId'
  | 'neonApiKey'
  | 'cloudflareApiUrl'
  | 'cloudflareAccountId'
  | 'appsNamespace'
  | 'cloudflareAppsToken'
  | 'e2bApiKey'
  | 'machineTemplate'
  | 'installationId'
>

/** The installation's env file the cloud case reads, outside the repository, named by its switch; none unless set. */
export function cloudSwitches() {
  if (CLOUD_ENV_FILE === undefined) return undefined
  return { envFile: CLOUD_ENV_FILE }
}
type Switches = NonNullable<ReturnType<typeof cloudSwitches>>

/** The env file read as production reads its environment, so a setting the Hub would refuse is refused here too. */
function cloudOf(envFile: string): Cloud {
  const real = readConfig('serve', parseEnv(readFileSync(envFile, 'utf8')))
  const { edgePort, appsDomain, appLoginKey, neonApiUrl, neonOrgId, neonApiKey } = real
  const { cloudflareApiUrl, cloudflareAccountId, appsNamespace, cloudflareAppsToken } = real
  const { e2bApiKey, machineTemplate, installationId } = real
  return {
    ...{ edgePort, appsDomain, appLoginKey, neonApiUrl, neonOrgId, neonApiKey },
    ...{ cloudflareApiUrl, cloudflareAccountId, appsNamespace, cloudflareAppsToken },
    ...{ e2bApiKey, machineTemplate, installationId },
  }
}

/** The ports the case reaches the providers through. */
type Outside = {
  neon: ReturnType<typeof createNeonProjects>
  cloudflare: ReturnType<typeof createCloudflareApps>
}

/**
 * Production's adapters (`main.ts`, `builderPortsOf`), except that a machine's seed comes from the
 * Git on disk alone: production's asks the real bucket when the Git is missing. With no conference
 * double, the Builder's check opens the apps' own.
 */
function outsideOf(config: Config, log: FailureLog) {
  const mark = { [MARK.origin]: config.installationId }
  return {
    neon: createNeonProjects({ config, log }),
    companyPostgres: createCompanyPostgres({
      transport: neonTransport,
      appLoginKey: config.appLoginKey,
    }),
    cloudflare: createCloudflareApps({ config, log }),
    machinesOf: () =>
      createMachines({
        ...{ log, mark, installation: config.installationId, template: config.machineTemplate },
        kit: createE2bKit(config),
        api: createE2bApi(config, mark),
        seedOf: async (ids) => {
          const git = openRepository({ root: config.gitRoot, ...ids, log })
          await git.ensure()
          return git.bundleOfMain()
        },
      }),
    confer: undefined,
  }
}

/** Removes what the case left at the providers: every version's Worker, each Projeto's conference Worker and the company's Neon project; what did not go is named. */
async function removed(ports: Outside, hub: Hub, companyId: string): Promise<string[]> {
  const versions = await hub.test.asOwner('select id from apps.app_version where company_id = $1', [
    companyId,
  ])
  const projects = await hub.test.asOwner('select id from projects.project where company_id = $1', [
    companyId,
  ])
  const workers = [
    ...versions.map((row) => appWorkerOf(AppVersionId.parse(row.id))),
    ...projects.map((row) => appCheckWorkerOf(ProjectId.parse(row.id))),
  ]
  const left: string[] = []
  for (const worker of workers) {
    if ((await ports.cloudflare.remove(worker)).kind !== 'DONE') left.push(worker)
  }
  const found = await ports.neon.find(CompanyId.parse(companyId))
  if (found.kind !== 'DONE') return [...left, `the Neon projects of ${companyId}`]
  for (const { id } of found.value) {
    if ((await ports.neon.delete(id)).kind !== 'DONE') left.push(`the Neon project ${id}`)
  }
  return left
}

/**
 * The test Hub on the real providers, for the case of the cloud checkpoint: its machines are E2B's,
 * its conference uploads the real `c-<projectId>` Worker over the company's Neon database, and its
 * edge listens on the installation's edge port. Ana owns a planted company whose model account is
 * the test Claude subscription, signed in as the other real-model cases do. At the end it removes the Workers and the Neon project the
 * case made, and fails if any is left.
 *
 * What the operator provides, which the code cannot:
 * - `CONEXUS_EVAL_CLOUD_ENV`: an env file outside the repository with the installation's `HUB_*`
 *   settings, every one production's `readConfig` asks, its secret files on this machine. It is
 *   the installation of the deployed dispatcher, whose app login key it shares, and its
 *   `HUB_E2B_TEMPLATE` names the template with the browser.
 * - The test model account's Claude subscription: its kept login in `CONEXUS_EVAL_CLAUDE_CREDENTIAL`,
 *   or the sign-in code written into the report folder when the link comes (`test-real-model.ts`).
 * - The dispatcher deployed with this step's code, its Workers VPC service reaching this machine's
 *   `HUB_EDGE_PORT`: it asks this Hub for the conference session, and no other Hub knows it.
 * - The apps domain's wildcard routed to that dispatcher, so the machine's browser reaches the host.
 */
export async function cloudHub(t: TestContext, switches: Switches, folder: string) {
  const cloud = cloudOf(switches.envFile)
  let ports: Outside | undefined
  let hub: Awaited<ReturnType<typeof hubWithLog>> | undefined
  let companyId: string | undefined
  const left: string[] = []
  let failed: Error | undefined
  // Registered before the Hub's own cleanup, so it runs while the database still holds the ids.
  // It never throws: a hook that throws skips the ones after it, the Hub's close among them.
  t.after(async () => {
    if (ports === undefined || hub === undefined || companyId === undefined) return
    try {
      left.push(...(await removed(ports, hub, companyId)))
    } catch (error) {
      failed = new Error('the removal at the providers failed', { cause: error })
    }
  })
  hub = await hubWithLog(t, (config) => ({ ...config, ...cloud }), {
    outside: (config, log) => {
      const made = outsideOf(config, log)
      ports = made
      return made
    },
  })
  t.after(() => {
    if (failed !== undefined) throw failed
    if (left.length > 0) throw new Error(`left at the providers: ${left.join(', ')}`)
  })
  await listenQuietly(hub.edge, hub.config.edgePort)
  const ana = await personOn(hub, ANA_OWNER)
  companyId = await plantCompany(hub.test, ana.id)
  await claudeSubscribed({ t, hub, ana, companyId, folder })
  return { hub, ana, companyId }
}
