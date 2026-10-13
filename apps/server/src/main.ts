import { join } from 'node:path'
import { getStatus } from '@conexus/hub-api'
import closeWithGrace from 'close-with-grace'
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { createStatus } from './hub/status/public.ts'
import type { Config } from './platform/config.ts'
import { readConfig } from './platform/config.ts'
import { Failure, logFailure } from './platform/failure.ts'
import { registerHealth } from './platform/health.ts'
import { createServer, serve } from './platform/http.ts'

const SHUTDOWN_DEADLINE_MS = 15_000
const WEB_ROOT = join(import.meta.dirname, '..', '..', 'web', 'dist')

/** Builds the Hub without listening. `webRoot` is where the built screens are; without them `/` answers 404. */
export async function createHub(
  config: Config,
  options: { webRoot?: string } = {},
): Promise<FastifyInstance> {
  const app = await createServer(config, options.webRoot ?? WEB_ROOT)
  registerHealth(app)
  serve(app, getStatus, createStatus({ version: config.version }).read)
  await app.ready()
  return app
}

async function run(): Promise<void> {
  let config: Config
  try {
    config = readConfig()
  } catch (error) {
    if (!(error instanceof Failure)) throw error
    logFailure(Fastify({ logger: { level: 'error' } }).log, error)
    process.exitCode = 1
    return
  }
  const app = await createHub(config)
  closeWithGrace({ delay: SHUTDOWN_DEADLINE_MS, logger: app.log }, async () => {
    app.log.info('SHUTTING_DOWN')
    await app.close()
  })
  await app.listen({ host: '0.0.0.0', port: config.port })
}

if (import.meta.main) await run()
