import type { ConnectorId } from '@conexus/connectors'
import { connectorOf } from '@conexus/connectors'
import { CALL_DEADLINE_MS } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { Config } from '../../platform/config.ts'
import type { ConnectorApp } from '../../platform/config-connectors.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { isOAuth } from './apps.ts'
import { createExecutor } from './executor.ts'
import { reseal } from './reseal.ts'
import { registerConnectionRoutes } from './routes.ts'

/** Tests shorten the deadline. */
export type ConnectorDeadlines = { callDeadlineMs?: number }

export type Connectors = ReturnType<typeof createConnectors>

/**
 * The company's connections to outside systems (decision 0056): the only subject that imports the
 * kit and opens a connection's seal. A double's origin the configuration names for a connector the
 * kit does not have refuses the Hub (criterion 16), and so does an app's keys for a connector the
 * kit does not have or that is not OAuth (19.1, criterion 10). Tests shorten the deadline.
 */
export function createConnectors(deps: {
  database: Database
  identity: IdentityPorts
  config: Pick<Config, 'sealKeys' | 'connectorOrigins' | 'connectorApps' | 'publicOrigin'>
  log: FailureLog
  deadlines?: ConnectorDeadlines
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
  const apps = new Map<ConnectorId, ConnectorApp>()
  for (const [id, app] of deps.config.connectorApps ?? []) {
    const connector = connectorOf(id)
    if (connector === undefined || !isOAuth(connector))
      throw new Failure('CONFIG_INVALID', {
        details: { variables: 'HUB_CONNECTOR_APPS_FILE', reason: 'not an OAuth connector' },
      })
    apps.set(connector.id, app)
  }
  const executor = createExecutor({ fetch, origins, log: deps.log })
  const routeDeps = {
    ...deps,
    sealKeys: deps.config.sealKeys,
    publicOrigin: deps.config.publicOrigin,
    apps,
    origins,
    executor,
    log: deps.log,
    callDeadlineMs: deps.deadlines?.callDeadlineMs ?? CALL_DEADLINE_MS,
  }
  return Object.freeze({
    routes: (app: FastifyInstance) => registerConnectionRoutes(app, routeDeps),
  })
}

/** The `reseal` command's work for the connections: every one on the key that seals. */
export function resealConnections(deps: { database: Database; sealKeys: SealKeys }) {
  return reseal(deps)
}
