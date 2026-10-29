import type { ConnectorId } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import type { FastifyInstance } from 'fastify'
import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { createExecutor } from './executor.ts'
import { reseal } from './reseal.ts'
import { registerConnectionRoutes } from './routes.ts'

/** How long one call to a provider may take, the login included (the failure table: 10 s). */
const CALL_DEADLINE_MS = 10_000

/** How long Testar may take in all, from its first login: under the 100 s the Cloudflare edge allows (platform/http.ts). */
const TEST_DEADLINE_MS = 80_000

export type Connectors = ReturnType<typeof createConnectors>

/**
 * The company's connections to outside systems (decision 0056): the only subject that imports the
 * kit and opens a connection's seal. A double's origin the configuration names for a connector the
 * kit does not have refuses the Hub (criterion 16). Tests shorten `callDeadlineMs` and `testDeadlineMs`.
 */
export function createConnectors(deps: {
  database: Database
  identity: IdentityPorts
  config: Pick<Config, 'sealKeys' | 'connectorOrigins'>
  callDeadlineMs?: number
  testDeadlineMs?: number
}) {
  const origins = new Map<ConnectorId, string>()
  for (const [id, origin] of deps.config.connectorOrigins ?? []) {
    const connector = connectorOf(id)
    if (connector === undefined)
      throw new Failure('CONFIG_INVALID', {
        details: { variables: 'HUB_CONNECTOR_ORIGINS', reason: 'unknown connector' },
      })
    origins.set(connector.id, origin)
  }
  const executor = createExecutor({ fetch, origins })
  const routeDeps = {
    ...deps,
    sealKeys: deps.config.sealKeys,
    executor,
    callDeadlineMs: deps.callDeadlineMs ?? CALL_DEADLINE_MS,
    testDeadlineMs: deps.testDeadlineMs ?? TEST_DEADLINE_MS,
  }
  return Object.freeze({
    routes: (app: FastifyInstance) => registerConnectionRoutes(app, routeDeps),
  })
}

/** The `reseal` command's work for the connections: every one on the key that seals. */
export function resealConnections(deps: { database: Database; sealKeys: SealKeys }) {
  return reseal(deps)
}
