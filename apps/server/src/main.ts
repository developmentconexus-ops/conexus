import { join } from 'node:path'
import { getStatus } from '@conexus/hub-api'
import closeWithGrace from 'close-with-grace'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import type { Status } from './hub/status/public.ts'
import { createStatus } from './hub/status/public.ts'
import type { Config } from './platform/config.ts'
import { readConfig } from './platform/config.ts'
import { assertMigrated, openDatabase } from './platform/database.ts'
import { Failure, logFailure } from './platform/failure.ts'
import { registerHealth } from './platform/health.ts'
import { createServer, serve } from './platform/http.ts'
import { migrate } from './platform/migrate.ts'

const SHUTDOWN_DEADLINE_MS = 15_000
const WEB_ROOT = join(import.meta.dirname, '..', '..', 'web', 'dist')

/** `webRoot` is where the built screens are; without them `/` answers 404. */
export async function createHub(
  config: Config,
  deps: { status: Status; webRoot?: string },
): Promise<FastifyInstance> {
  const app = await createServer(config, deps.webRoot ?? WEB_ROOT)
  registerHealth(app)
  serve(app, getStatus, deps.status.read)
  await app.ready()
  return app
}

function bootLog(level: Config['logLevel']) {
  return Fastify({ logger: { level } }).log
}

async function runServer(): Promise<void> {
  const config = readConfig('serve')
  const log = bootLog(config.logLevel)
  const database = openDatabase({ url: config.databaseUrl, log })
  try {
    await assertMigrated(database)
    const status = createStatus({ version: config.version, database })
    const app = await createHub(config, { status })
    const grace = closeWithGrace(
      { delay: SHUTDOWN_DEADLINE_MS, logger: app.log },
      async ({ signal, err }) => {
        if (err) logFailure(app.log, new Failure('INTERNAL_UNEXPECTED', { cause: err }))
        app.log.info(signal === undefined ? {} : { signal }, 'SHUTTING_DOWN')
        await app.close()
        await database.close()
      },
    )
    try {
      await app.listen({
        host: '0.0.0.0',
        port: config.port,
        listenTextResolver: () => 'LISTENING',
      })
      await status.recordStart()
    } catch (error) {
      grace.uninstall()
      await app.close()
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

async function run(): Promise<void> {
  try {
    await (process.argv[2] === 'migrate' ? runMigrate() : runServer())
  } catch (error) {
    const failure =
      error instanceof Failure ? error : new Failure('INTERNAL_UNEXPECTED', { cause: error })
    logFailure(bootLog('error'), failure)
    process.exitCode = 1
  }
}

if (import.meta.main) await run()
