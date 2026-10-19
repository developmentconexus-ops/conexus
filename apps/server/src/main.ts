import { appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { Email, FAILURES, getStatus } from '@conexus/hub-api'
import closeWithGrace from 'close-with-grace'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { z } from 'zod'
import type { ModelAccounts } from './builder/model-accounts/public.ts'
import { createModelAccounts } from './builder/model-accounts/public.ts'
import type { Apps } from './hub/apps/public.ts'
import { createAppRemoval, createApps } from './hub/apps/public.ts'
import type { Identity } from './hub/identity/public.ts'
import { createIdentity, passwordLinkText } from './hub/identity/public.ts'
import type { Operations } from './hub/operations/public.ts'
import { createOperations } from './hub/operations/public.ts'
import type { Projects } from './hub/projects/public.ts'
import { createProjects } from './hub/projects/public.ts'
import type { Status } from './hub/status/public.ts'
import { createStatus } from './hub/status/public.ts'
import type { CloudflareApps } from './platform/cloudflare.ts'
import { createCloudflareApps } from './platform/cloudflare.ts'
import type { CompanyPostgres } from './platform/company-postgres.ts'
import { createCompanyPostgres, neonTransport } from './platform/company-postgres.ts'
import type { Config } from './platform/config.ts'
import { readConfig } from './platform/config.ts'
import type { Database } from './platform/database.ts'
import {
  assertMigrated,
  assertRuntimeLogin,
  databaseFailure,
  openDatabase,
} from './platform/database.ts'
import { createEdgeServer } from './platform/edge-server.ts'
import type { FailureLog } from './platform/failure.ts'
import { Failure, logFailure } from './platform/failure.ts'
import { registerHealth } from './platform/health.ts'
import { answer, createServer, serve } from './platform/http.ts'
import { createMail } from './platform/mail.ts'
import { migrate } from './platform/migrate.ts'
import type { NeonProjects } from './platform/neon.ts'
import { createNeonProjects } from './platform/neon.ts'

const SHUTDOWN_DEADLINE_MS = 15_000
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
    webRoot?: string
  },
): Promise<FastifyInstance> {
  const app = await createServer(config, {
    webRoot: deps.webRoot ?? WEB_ROOT,
    readSession: deps.identity.readSession,
  })
  registerHealth(app)
  serve(app, getStatus, async () => answer(await deps.status.read()))
  deps.identity.routes(app)
  deps.operations.routes(app)
  deps.projects.routes(app)
  deps.apps.routes(app)
  deps.modelAccounts.routes(app)
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
 * Builder's model accounts reach identity the same way, with the installation's seal keys.
 */
export function subjectsOf(deps: {
  database: Database
  config: Config
  identity: Identity
  neon: NeonProjects
  companyPostgres: CompanyPostgres
  cloudflare: CloudflareApps
  log: FailureLog
}): { projects: Projects; operations: Operations; apps: Apps; modelAccounts: ModelAccounts } {
  const { database, config, log, neon } = deps
  const identity = deps.identity.ports
  const appsDomain = config.appsDomain
  const appRemoval = createAppRemoval(deps)
  const projects = createProjects({ database, identity, neon, log, appsDomain, appRemoval })
  const operations = createOperations({
    database,
    identity,
    projects: projects.ports,
    appRemoval,
  })
  const apps = createApps({ ...deps, identity, projects: projects.ports, appsDomain })
  const modelAccounts = createModelAccounts({ database, identity, sealKeys: config.sealKeys })
  return { projects, operations, apps, modelAccounts }
}

/**
 * The first-person command logs to stderr: its stdout is the terminal of infra/first-person.sh,
 * where the link goes.
 */
function bootLog(level: Config['logLevel'], command = process.argv[2]) {
  const stream = command === 'first-person' ? process.stderr : process.stdout
  return Fastify({ logger: { level, stream } }).log
}

/** Fastify's own listening line is prose; the Hub logs its code once both listeners are up (C50). */
async function listenQuietly(app: FastifyInstance, port: number): Promise<void> {
  const { level } = app.log
  app.log.level = 'silent'
  try {
    await app.listen({ host: '0.0.0.0', port })
  } finally {
    app.log.level = level
  }
}

/**
 * close-with-grace's own lines are prose, so its logger is off and each of its cases logs a code
 * here (code C50).
 */
function shutDownOnSignal(app: FastifyInstance, edge: FastifyInstance, database: Database) {
  function unexpected(cause: unknown) {
    logFailure(app.log, new Failure('INTERNAL_UNEXPECTED', { cause }))
  }
  return closeWithGrace(
    {
      delay: SHUTDOWN_DEADLINE_MS,
      logger: false,
      onSecondSignal: (signal) => app.log.error({ signal }, 'SHUTDOWN_FORCED'),
      onSecondError: unexpected,
      onTimeout: (delay) => app.log.error({ deadlineMs: delay }, 'SHUTDOWN_TIMED_OUT'),
    },
    async ({ signal, err }) => {
      if (err) unexpected(err)
      app.log.info(signal === undefined ? {} : { signal }, 'SHUTTING_DOWN')
      try {
        await Promise.all([app.close(), edge.close()])
        await database.close()
      } catch (error) {
        unexpected(error)
        throw error
      }
    },
  )
}

async function runServer(): Promise<void> {
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
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
    const { projects, operations, apps, modelAccounts } = subjectsOf({
      ...{ database, config, identity },
      ...{ neon, companyPostgres, cloudflare, log },
    })
    const app = await createHub(config, {
      status,
      identity,
      operations,
      projects,
      apps,
      modelAccounts,
    })
    const edge = await createEdgeHub(config, { apps })
    const grace = shutDownOnSignal(app, edge, database)
    try {
      await listenQuietly(edge, config.edgePort)
      await listenQuietly(app, config.port)
      app.log.info('LISTENING')
      await status.recordStart()
      // The passes at start run after the Hub answers: a Cloudflare or Neon out never keeps it down.
      void apps.repair().catch((error: unknown) => logFailure(log, databaseFailure(error)))
      void projects
        .nameDatabases()
        .catch((error: unknown) => logFailure(log, databaseFailure(error)))
    } catch (error) {
      grace.uninstall()
      await Promise.all([app.close(), edge.close()])
      throw error
    }
  } catch (error) {
    await database.close()
    throw error
  }
}

async function runMigrate(): Promise<void> {
  const config = readConfig('migrate')
  await migrate({ ownerUrl: config.migrationDatabaseUrl, runtimeUrl: config.databaseUrl })
  bootLog(config.logLevel).info('MIGRATED')
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

const COMMANDS: Record<string, (args: string[]) => Promise<void>> = {
  migrate: runMigrate,
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
