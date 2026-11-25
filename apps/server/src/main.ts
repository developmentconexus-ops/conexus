import { join } from 'node:path'
import { getStatus } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type {
  BuilderConfer,
  GitCopy,
  MachinesOf,
  RepositoryOf,
} from './agents/app-builder/public.ts'
import { builderPortsOf, createRuns, repositoriesIn } from './agents/app-builder/public.ts'
import { runFirstPerson, runMigrate } from './commands.ts'
import { conversationsOf } from './conversations-of.ts'
import type { ConversationMachine, MachineTuning } from './harness/machine/public.ts'
import { conversationMachineOf } from './harness/machine/public.ts'
import {
  createModelAccounts,
  openGoogleCalls,
  signInFlows,
} from './harness/model-accounts/public.ts'
import { createAccess } from './hub/access/public.ts'
import type { Apps, CloseRequests, Ungranted } from './hub/apps/public.ts'
import { appAccessOf, createAppRemoval, createApps, versionNumbersOf } from './hub/apps/public.ts'
import type { Connectors, ConnectorTuning } from './hub/connectors/public.ts'
import { createConnectors, roleKit } from './hub/connectors/public.ts'
import type { DataDeps } from './hub/data/public.ts'
import { createCompanyData, createDataReads, recordRead } from './hub/data/public.ts'
import type { Identity } from './hub/identity/public.ts'
import { createIdentity } from './hub/identity/public.ts'
import { createLakes } from './hub/lake/public.ts'
import { notificationsOf } from './hub/notifications/public.ts'
import { createOperations } from './hub/operations/public.ts'
import { createProjects } from './hub/projects/public.ts'
import { requestsOf } from './hub/requests/public.ts'
import type { Status } from './hub/status/public.ts'
import { createStatus } from './hub/status/public.ts'
import type { LakeStacks } from './platform/aws.ts'
import { createLakeStacks } from './platform/aws.ts'
import type { CloudflareApps } from './platform/cloudflare.ts'
import { createCloudflareApps, createCloudflareTools } from './platform/cloudflare.ts'
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
import { createEdgeTools } from './platform/edge-tools.ts'
import type { FailureLog } from './platform/failure.ts'
import { Failure, logFailure } from './platform/failure.ts'
import { registerHealth } from './platform/health.ts'
import { answer, createServer, serve } from './platform/http.ts'
import { bootLog, closeListeners, listenQuietly, shutDownOnSignal } from './platform/lifecycle.ts'
import type { SendMail } from './platform/mail.ts'
import { createMail } from './platform/mail.ts'
import { watchMemory } from './platform/memory.ts'
import { migrateExitCode } from './platform/migrate.ts'
import { loadMigrationRule } from './platform/migration-rule.ts'
import type { NeonProjects } from './platform/neon.ts'
import { createNeonProjects } from './platform/neon.ts'
import { runReseal } from './reseal.ts'

const WEB_ROOT = join(import.meta.dirname, '..', '..', 'web', 'dist')

// Within the 15 s shutdown deadline: each live provider token's logout gets this long.
const SHUTDOWN_LOGOUT_MS = 5_000
/** `webRoot` is where the built screens are; without them `/` answers 404. */
export async function createHub(
  config: Config,
  deps: Omit<Subjects, 'runs' | 'data' | 'access'> & {
    status: Status
    identity: Identity
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
  for (const part of [
    ...[deps.operations, deps.projects, deps.apps, deps.modelAccounts, deps.conversations],
    ...[deps.assistant, deps.automations, deps.agents, deps.notifications, deps.connectors],
    ...[deps.requests, deps.dataReads, deps.lakes],
  ]) {
    part.routes(app)
  }
  await app.ready()
  return app
}

type Subjects = ReturnType<typeof subjectsOf>

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
  sendMail: SendMail
  neon: NeonProjects
  /** The companies' lakes in AWS (card o-lago-da-empresa-nasce-e-some). */
  lakeStacks: LakeStacks
  companyPostgres: CompanyPostgres
  cloudflare: CloudflareApps
  /** The saved tools' namespace (step 24.4); the Hub calls their host through `createEdgeTools`. */
  cloudflareTools: CloudflareApps
  mastraPool: MastraPool
  machinesOf: MachinesOf
  conversationMachine: ConversationMachine
  /** The tests' folder and start deadline for the conversations' machines (`test-runs.ts`). */
  machineTuning?: MachineTuning
  /** The tests' double of the conference the check's browser opens (`test-runs.ts`); the apps' by default. */
  confer?: BuilderConfer
  repository: RepositoryOf
  copy: GitCopy
  log: FailureLog
  tuning?: ConnectorTuning
  /** The tests' budget for a send's prune (`test-hub.ts`); production's by default. */
  pruneBudgetMs?: number
  /** The tests' deadline for one look at an app's database (`test-hub.ts`); the apps' call limit by default. */
  appDataDeadlineMs?: number
}) {
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
    confer: deps.confer ?? {
      open: (input) => apps.confer.open(input),
      end: (input) => apps.confer.end(input),
    },
  })
  const notifications = notificationsOf({ ...deps, identity, publicOrigin: config.publicOrigin })
  const { conversations, assistant, automations, agents } = conversationsOf({
    ...{ database, identity, sealKeys, google, log, runs, mastraPool: deps.mastraPool },
    ...{ machine: deps.conversationMachine, machineTuning: deps.machineTuning },
    tools: { cloudflare: deps.cloudflareTools, edge: createEdgeTools({ config, log }) },
    ...{ connectors: () => connectors, apps: () => apps, projects: () => projects.ports },
    // The data and the access door are made below, after the connectors they read; a turn comes long after.
    companyData: (principal, context) => data(principal, context),
    access: { viewOf: (principal) => access.viewOf(principal) },
    ...{ notify: notifications.notify, automationClock: config.automationClock },
  })
  const releaseConversations = conversations.release
  const projects = createProjects({
    ...{ database, identity, neon, log, appsDomain, appRemoval, appVersionsOf: versionNumbersOf },
    ...{ releaseConversations, ...appAccessOf(database) },
    // The requests come below, after the apps they publish through; a Projeto's read comes long after.
    publishRequestOf: (tx, input) => requests.publishRequestOf(tx, input),
  })
  const { lakes, operations } = centralOf({
    ...{ database, identity, config, log, aws: deps.lakeStacks, projects: projects.ports },
    ...{ appRemoval, releaseConversations },
  })
  // The connectors come below, after the apps whose door they read; a publish comes long after.
  const ungranted: Ungranted = (tx, ids, declared, by) =>
    connectors.ungranted(tx, ids, declared, by)
  const closeRequests: CloseRequests = (tx, input) => requests.closeRequests(tx, input)
  const apps = createApps({
    ...{ ...deps, identity, appsDomain, ungranted, closeRequests, recordRead: recordRead(deps) },
    ...{ appDataDeadlineMs: deps.appDataDeadlineMs, projects: projects.ports },
  })
  const { noticeRequests } = notifications
  const requests = requestsOf({ database, identity, ungranted, noticeRequests, log })
  const flows = signInFlows({ cliProxy: config.cliProxy, log })
  const modelAccounts = createModelAccounts({
    ...{ database, identity, sealKeys, flows, log, googleCalls: google.googleCalls },
  })
  const connectors = createConnectors({
    ...{ ...deps, identity, door: apps.connectorCall, recordRead: recordRead(deps) },
  })
  const access = createAccess({
    database,
    identity,
    sources: { systems: connectors.access.systems },
  })
  const { data, dataReads } = dataOf({
    ...{ database, identity, log, access, projects: projects.ports },
    connectors: () => connectors,
  })
  return {
    ...{ runs, projects, operations, lakes, apps, modelAccounts, requests, access, dataReads },
    ...{ conversations, assistant, automations, agents, notifications, connectors, data },
  }
}

/** The Operations Central, and the lakes it frees with a client's database (card L.13). */
function centralOf(
  deps: Omit<Parameters<typeof createOperations>[0], 'outside'> & Parameters<typeof createLakes>[0],
) {
  const lakes = createLakes(deps)
  const outside = [deps.projects.companyDatabase, lakes.outside]
  return { lakes, operations: createOperations({ ...deps, outside }) }
}

/** The access contract the agents read through, and the Registro de dados its reads leave. */
function dataOf(deps: DataDeps) {
  return { data: createCompanyData(deps), dataReads: createDataReads(deps) }
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
    // One mail adapter for the identity's invitations and the notifications' e-mail (step 24.2).
    const sendMail = createMail({ config, log })
    const identity = createIdentity({ database, config, log, sendMail, kit: roleKit() })
    const neon = createNeonProjects({ config, log })
    const lakeStacks = createLakeStacks({ config, log })
    const companyPostgres = createCompanyPostgres({
      transport: neonTransport,
      appLoginKey: config.appLoginKey,
    })
    const cloudflare = createCloudflareApps({ config, log })
    const cloudflareTools = createCloudflareTools({ config, log })
    const subjects = subjectsOf({
      ...{ database, config, identity, sendMail },
      ...{ neon, lakeStacks, companyPostgres, cloudflare, cloudflareTools, mastraPool, log },
      ...builderPortsOf({ config, log }),
      conversationMachine: conversationMachineOf(config),
    })
    const { projects, apps, conversations, modelAccounts, runs, connectors } = subjects
    await conversations.prepare()
    const app = await createHub(config, { status, identity, ...subjects })
    await conversations.start()
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
      watchMemory(log)
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
