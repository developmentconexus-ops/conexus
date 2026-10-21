import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { Email, FAILURES, getStatus } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { Conversations } from './builder/conversation/public.ts'
import { createConversations } from './builder/conversation/public.ts'
import type { GitCopy } from './builder/git/public.ts'
import type { ModelAccounts } from './builder/model-accounts/public.ts'
import {
  createModelAccounts,
  openGoogleCalls,
  resealModelAccounts,
  signInFlows,
} from './builder/model-accounts/public.ts'
import type { MachinesOf, RepositoryOf, Runs } from './builder/runs/public.ts'
import { builderPortsOf, createRuns } from './builder/runs/public.ts'
import type { Apps } from './hub/apps/public.ts'
import { createAppRemoval, createApps } from './hub/apps/public.ts'
import type { Identity } from './hub/identity/public.ts'
import { createIdentity, passwordLinkText } from './hub/identity/public.ts'
import type { Operations } from './hub/operations/public.ts'
import { createOperations } from './hub/operations/public.ts'
import type { Projects } from './hub/projects/public.ts'
import { createProjects, liveProjectOf } from './hub/projects/public.ts'
import type { Status } from './hub/status/public.ts'
import { createStatus } from './hub/status/public.ts'
import type { CloudflareApps } from './platform/cloudflare.ts'
import { createCloudflareApps } from './platform/cloudflare.ts'
import type { CompanyPostgres } from './platform/company-postgres.ts'
import { createCompanyPostgres, neonTransport } from './platform/company-postgres.ts'
import type { Config } from './platform/config.ts'
import { readConfig } from './platform/config.ts'
import type { Database, MastraPool } from './platform/database.ts'
import {
  assertMigrated,
  assertRuntimeLogin,
  databaseFailure,
  openDatabase,
  openMastraPool,
} from './platform/database.ts'
import { createEdgeServer } from './platform/edge-server.ts'
import type { FailureLog } from './platform/failure.ts'
import { Failure, logFailure } from './platform/failure.ts'
import { registerHealth } from './platform/health.ts'
import { answer, createServer, serve } from './platform/http.ts'
import { bootLog, listenQuietly, shutDownOnSignal } from './platform/lifecycle.ts'
import { createMail } from './platform/mail.ts'
import { migrate } from './platform/migrate.ts'
import type { NeonProjects } from './platform/neon.ts'
import { createNeonProjects } from './platform/neon.ts'

const WEB_ROOT = join(import.meta.dirname, '..', '..', 'web', 'dist')

/** `webRoot` is where the built screens are; without them `/` answers 404. */
export async function createHub(
  config: Config,
  deps: {
    status: Status
    identity: Identity
    operations: Operations
    projects: Projects
    apps: Apps
    modelAccounts: ModelAccounts
    conversations: Conversations
    webRoot?: string
  },
): Promise<FastifyInstance> {
  const app = await createServer(config, {
    webRoot: deps.webRoot ?? WEB_ROOT,
    readSession: deps.identity.readSession,
  })
  registerHealth(app)
  serve(app, getStatus, async () => answer(await deps.status.read()))
  deps.identity.routes(app, { releaseConversations: deps.conversations.release })
  deps.operations.routes(app)
  deps.projects.routes(app)
  deps.apps.routes(app)
  deps.modelAccounts.routes(app)
  deps.conversations.routes(app)
  await app.ready()
  return app
}

/** The listener on `HUB_EDGE_PORT`: the apps' dispatcher's calls and nothing else (security S48). */
export async function createEdgeHub(
  config: Config,
  deps: { apps: Apps },
): Promise<FastifyInstance> {
  const edge = await createEdgeServer(config)
  deps.apps.edgeRoutes(edge)
  await edge.ready()
  return edge
}

/** The identity subject, sending its mail through the provider the configuration names. */
export function identityOf(deps: {
  database: Database
  config: Config
  log: FailureLog
}): Identity {
  return createIdentity({ ...deps, sendMail: createMail(deps) })
}

/**
 * The subjects past identity, each reaching another only through its ports (code C4), and Neon,
 * the companies' databases and Cloudflare only through the ports it is given (C56). Deleting a
 * Projeto or a client reaches its apps through the apps' removal, made before either subject. The
 * Builder's model accounts reach identity the same way, with the installation's seal keys, and its
 * conversations reach Mastra's database only through the pool of Mastra's own login (0010).
 */
export function subjectsOf(deps: {
  database: Database
  config: Config
  identity: Identity
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  cloudflare: CloudflareApps
  mastraPool: MastraPool
  machinesOf: MachinesOf
  repository: RepositoryOf
  copy: GitCopy
  turnMs?: () => number
  renewMs?: () => number
  yieldMs?: () => number
  log: FailureLog
}): {
  runs: Runs
  projects: Projects
  operations: Operations
  apps: Apps
  modelAccounts: ModelAccounts
  conversations: Conversations
} {
  const { database, config, log, neon } = deps
  const identity = deps.identity.ports
  const appsDomain = config.appsDomain
  const appRemoval = createAppRemoval(deps)
  const sealKeys = config.sealKeys
  const google = openGoogleCalls({ cliProxy: config.cliProxy, log, database, sealKeys })
  const { repository, copy } = deps
  const machines = deps.machinesOf(database)
  const runs = createRuns({
    ...{ database, log, machines, repository, copy },
    ...{ turnMs: deps.turnMs, renewMs: deps.renewMs, yieldMs: deps.yieldMs },
  })
  const conversations = createConversations({
    ...{ database, identity, projects: { liveProjectOf }, sealKeys, google, log, runs },
    pool: deps.mastraPool,
  })
  const releaseConversations = conversations.release
  const projects = createProjects({
    ...{ database, identity, neon, log, appsDomain, appRemoval },
    releaseConversations,
  })
  const operations = createOperations({
    ...{ database, identity, projects: projects.ports },
    ...{ appRemoval, releaseConversations },
  })
  const apps = createApps({ ...deps, identity, projects: projects.ports, appsDomain })
  const flows = signInFlows({ cliProxy: config.cliProxy, log })
  const modelAccounts = createModelAccounts({
    database,
    identity,
    sealKeys: config.sealKeys,
    flows,
    googleCalls: google.googleCalls,
    log,
  })
  return { runs, projects, operations, apps, modelAccounts, conversations }
}

async function runServer(): Promise<void> {
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  const mastraPool = openMastraPool({ url: config.mastraDatabaseUrl, log })
  try {
    await assertRuntimeLogin(database)
    await assertMigrated(database)
    const status = createStatus({ version: config.version, database })
    const identity = identityOf({ database, config, log })
    const neon = createNeonProjects({ config, log })
    const companyPostgres = createCompanyPostgres({
      transport: neonTransport,
      appLoginKey: config.appLoginKey,
    })
    const cloudflare = createCloudflareApps({ config, log })
    const subjects = subjectsOf({
      ...{ database, config, identity },
      ...{ neon, companyPostgres, cloudflare, mastraPool, log },
      ...builderPortsOf({ config, log }),
    })
    const { projects, apps, conversations, modelAccounts, runs } = subjects
    await conversations.prepare()
    const app = await createHub(config, { status, identity, ...subjects })
    const edge = await createEdgeHub(config, { apps })
    const grace = shutDownOnSignal(app, edge, {
      drain: () => conversations.close(),
      release: () => Promise.all([database.close(), mastraPool.end()]).then(() => undefined),
    })
    try {
      await listenQuietly(edge, config.edgePort)
      await listenQuietly(app, config.port)
      app.log.info('LISTENING')
      await status.recordStart()
      // The passes at start run after the Hub answers: a Cloudflare or Neon out never keeps it down.
      void apps.repair().catch((error: unknown) => logFailure(log, databaseFailure(error)))
      // The turns left open with time are taken first; what is left of the old leases is settled.
      void conversations
        .resumeRuns()
        .then(() => runs.settleRuns())
        .catch((error: unknown) => logFailure(log, databaseFailure(error)))
      void projects
        .nameDatabases()
        .catch((error: unknown) => logFailure(log, databaseFailure(error)))
      void modelAccounts
        .readUnserved()
        .catch((error: unknown) => logFailure(log, databaseFailure(error)))
    } catch (error) {
      grace.uninstall()
      await Promise.all([app.close(), edge.close(), conversations.close()])
      throw error
    }
  } catch (error) {
    await Promise.all([database.close(), mastraPool.end()])
    throw error
  }
}

async function runMigrate(): Promise<void> {
  const config = readConfig('migrate')
  await migrate({
    ownerUrl: config.migrationDatabaseUrl,
    runtimeUrl: config.databaseUrl,
    mastraUrl: config.mastraDatabaseUrl,
  })
  const log = bootLog(config.logLevel)
  log.info('MASTRA_LOGIN_READY')
  log.info('MIGRATED')
}

const FirstPersonArguments = z.object({
  name: z.string().trim().min(1),
  email: Email,
  summary: z.string().min(1),
})

function firstPersonArguments(args: string[]) {
  const { values } = parseArgs({
    args,
    options: { name: { type: 'string' }, email: { type: 'string' }, summary: { type: 'string' } },
  })
  const parsed = FirstPersonArguments.safeParse(values)
  if (!parsed.success) {
    const variables = parsed.error.issues.map((issue) => `--${String(issue.path[0])}`).join(',')
    throw new Failure('CONFIG_INVALID', { details: { variables } })
  }
  return parsed.data
}

async function runFirstPerson(args: string[]): Promise<void> {
  const input = firstPersonArguments(args)
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  try {
    await assertRuntimeLogin(database)
    await assertMigrated(database)
    const identity = identityOf({ database, config, log })
    const { link } = await identity.firstPerson({ name: input.name, email: input.email })
    appendFileSync(input.summary, passwordLinkText(input.name, link))
    log.info({}, 'FIRST_PERSON_LINK_GIVEN')
  } catch (error) {
    if (error instanceof Failure && error.code === 'FIRST_PERSON_EXISTS') {
      appendFileSync(input.summary, `${FAILURES.FIRST_PERSON_EXISTS.phrase}\n`)
    }
    throw error
  } finally {
    await database.close()
  }
}

/** Each deploy's step after migrate: moves the credentials off keys that only open (security S32). */
async function runReseal(): Promise<void> {
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  try {
    await assertRuntimeLogin(database)
    await assertMigrated(database)
    const counts = await resealModelAccounts({ database, sealKeys: config.sealKeys })
    log.info({ moved: counts.moved, refused: counts.refused }, 'RESEALED')
  } finally {
    await database.close()
  }
}

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  migrate: runMigrate,
  reseal: runReseal,
  'first-person': runFirstPerson,
}

async function run(): Promise<void> {
  try {
    const [command = '', ...args] = process.argv.slice(2)
    await (COMMANDS[command] ?? runServer)(args)
  } catch (error) {
    const failure =
      error instanceof Failure ? error : new Failure('INTERNAL_UNEXPECTED', { cause: error })
    logFailure(bootLog('info'), failure)
    process.exitCode = 1
  }
}

if (import.meta.main) await run()
