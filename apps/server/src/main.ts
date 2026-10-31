import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { FAILURES, getStatus } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Conversations } from './builder/conversation/public.ts'
import { createConversations } from './builder/conversation/public.ts'
import type { GitCopy } from './builder/git/public.ts'
import { repositoriesIn } from './builder/git/public.ts'
import type { ModelAccounts } from './builder/model-accounts/public.ts'
import {
  createModelAccounts,
  openGoogleCalls,
  resealModelAccounts,
  signInFlows,
} from './builder/model-accounts/public.ts'
import type { MachinesOf, RepositoryOf, Runs } from './builder/runs/public.ts'
import { builderPortsOf, createRuns } from './builder/runs/public.ts'
import { firstPersonArguments } from './first-person-arguments.ts'
import type { Apps, Ungranted } from './hub/apps/public.ts'
import { appAccessOf, createAppRemoval, createApps, versionNumbersOf } from './hub/apps/public.ts'
import type { ConnectorDeadlines, Connectors } from './hub/connectors/public.ts'
import { createConnectors, resealConnections } from './hub/connectors/public.ts'
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
import { bootLog, closeListeners, listenQuietly, shutDownOnSignal } from './platform/lifecycle.ts'
import { createMail } from './platform/mail.ts'
import { migrate, migrateExitCode } from './platform/migrate.ts'
import { loadMigrationRule } from './platform/migration-rule.ts'
import type { NeonProjects } from './platform/neon.ts'
import { createNeonProjects } from './platform/neon.ts'

const WEB_ROOT = join(import.meta.dirname, '..', '..', 'web', 'dist')

// Within the 15 s shutdown deadline: each live provider token's logout gets this long.
const SHUTDOWN_LOGOUT_MS = 5_000
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
    connectors: Connectors
    webRoot?: string
  },
): Promise<FastifyInstance> {
  const app = await createServer(config, {
    webRoot: deps.webRoot ?? WEB_ROOT,
    readSession: deps.identity.readSession,
  })
  registerHealth(app)
  serve(app, getStatus, async () => answer(await deps.status.read()))
  deps.identity.routes(app, {
    releaseConversations: deps.conversations.release,
    apps: deps.projects.appInvitations,
  })
  deps.operations.routes(app)
  deps.projects.routes(app)
  deps.apps.routes(app)
  deps.modelAccounts.routes(app)
  deps.conversations.routes(app)
  deps.connectors.routes(app)
  await app.ready()
  return app
}

/** The listener on `HUB_EDGE_PORT`: the apps' dispatcher's calls and nothing else (security S48). */
export async function createEdgeHub(
  config: Config,
  deps: { apps: Apps; connectors: Connectors },
): Promise<FastifyInstance> {
  const edge = await createEdgeServer(config)
  deps.apps.edgeRoutes(edge)
  deps.connectors.edgeRoutes(edge)
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
  log: FailureLog
  deadlines?: ConnectorDeadlines
}): {
  runs: Runs
  projects: Projects
  operations: Operations
  apps: Apps
  modelAccounts: ModelAccounts
  conversations: Conversations
  connectors: Connectors
} {
  const { database, config, log, neon } = deps
  const identity = deps.identity.ports
  const appsDomain = config.appsDomain
  const appRemoval = createAppRemoval(deps)
  const sealKeys = config.sealKeys
  const google = openGoogleCalls({ cliProxy: config.cliProxy, log, database, sealKeys })
  const { repository, copy } = deps
  const machines = deps.machinesOf()
  const runs = createRuns({
    ...{ database, log, machines, repository, copy },
    repositories: () => repositoriesIn(config.gitRoot),
    // The apps are made below, after the Projetos the turn's send needs; a turn ends long after.
    send: (version) => apps.sendFromBuilder(version),
  })
  // The connectors come below, after the apps whose door they read; a turn comes long after.
  const builderConnectors: Connectors['builder'] = {
    granted: (ids) => connectors.builder.granted(ids),
    read: (ids, a) => connectors.builder.read(ids, a),
    notes: (ids, connectionId) => connectors.builder.notes(ids, connectionId),
    saveNote: (ids, a) => connectors.builder.saveNote(ids, a),
  }
  const conversations = createConversations({
    ...{ database, identity, projects: { liveProjectOf }, sealKeys, google, log, runs },
    pool: deps.mastraPool,
    connectors: builderConnectors,
  })
  const releaseConversations = conversations.release
  const projects = createProjects({
    ...{ database, identity, neon, log, appsDomain, appRemoval, appVersionsOf: versionNumbersOf },
    ...{ releaseConversations, ...appAccessOf(database) },
  })
  const operations = createOperations({
    ...{ database, identity, projects: projects.ports },
    ...{ appRemoval, releaseConversations },
  })
  // The connectors come below, after the apps whose door they read; a publish comes long after.
  const ungranted: Ungranted = (tx, ids, declared) => connectors.ungranted(tx, ids, declared)
  const apps = createApps({ ...deps, identity, projects: projects.ports, appsDomain, ungranted })
  const flows = signInFlows({ cliProxy: config.cliProxy, log })
  const modelAccounts = createModelAccounts({
    ...{ database, identity, sealKeys, flows, log, googleCalls: google.googleCalls },
  })
  const connectors = createConnectors({ ...deps, identity, door: apps.connectorCall })
  return { runs, projects, operations, apps, modelAccounts, conversations, connectors }
}

async function runServer(): Promise<void> {
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  const mastraPool = openMastraPool({ url: config.mastraDatabaseUrl, log })
  try {
    await assertRuntimeLogin(database)
    await assertMigrated(database)
    await loadMigrationRule()
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
    const { projects, apps, conversations, modelAccounts, runs, connectors } = subjects
    await conversations.prepare()
    const app = await createHub(config, { status, identity, ...subjects })
    const edge = await createEdgeHub(config, { apps, connectors })
    const grace = shutDownOnSignal(app, edge, {
      settle: (bound) => conversations.settle(bound),
      drain: () => conversations.close(),
      // Every live provider token is logged out before the database closes.
      release: () =>
        connectors
          .closeAll(SHUTDOWN_LOGOUT_MS)
          .finally(() => Promise.all([database.close(), mastraPool.end()]).then(() => undefined)),
    })
    try {
      await listenQuietly(edge, config.edgePort)
      await listenQuietly(app, config.port)
      app.log.info('LISTENING')
      await status.recordStart()
      // The passes at start run after the Hub answers: a Cloudflare or Neon out never keeps it down.
      void apps.repair().catch((error: unknown) => logFailure(log, databaseFailure(error)))
      // The copies the bucket did not take before the stop are tried again.
      void runs
        .resumeCopies()
        .catch((error: unknown) =>
          logFailure(log, new Failure('INTERNAL_UNEXPECTED', { cause: error })),
        )
      void projects
        .nameDatabases()
        .catch((error: unknown) => logFailure(log, databaseFailure(error)))
      void modelAccounts
        .readUnserved()
        .catch((error: unknown) => logFailure(log, databaseFailure(error)))
    } catch (error) {
      grace.uninstall()
      await closeListeners([app, edge], () => conversations.close())
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
    const accounts = await resealModelAccounts({ database, sealKeys: config.sealKeys })
    const connections = await resealConnections({ database, sealKeys: config.sealKeys })
    const moved = accounts.moved + connections.moved
    log.info({ moved, refused: accounts.refused + connections.refused }, 'RESEALED')
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
    process.exitCode = migrateExitCode(failure)
  }
}

if (import.meta.main) await run()
