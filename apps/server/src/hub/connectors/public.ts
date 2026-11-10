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
import type { AppDoorPort } from './app-calls.ts'
import { createAppCalls } from './app-calls.ts'
import { isOAuth } from './apps.ts'
import { createAssistantConnectors } from './assistant-port.ts'
import { createBuilderConnectors } from './builder-port.ts'
import { createCopyPort } from './copy-port.ts'
import { createExecutor } from './executor.ts'
import type { OfGrant } from './grants.ts'
import { grant, mayGrant } from './grants.ts'
import { createLimits } from './limits.ts'
import { ungrantedBy } from './publish-check.ts'
import { reseal } from './reseal.ts'
import {
  registerAppCallRoutes,
  registerConnectionRoutes,
  registerToolCallRoutes,
} from './routes.ts'
import { createToolDoor } from './tool-door.ts'

/** The kit's copy contracts, which `hub/copies` parses with and never imports from the kit (decision 0056). */
export { CopyDefinition, CopyName } from '@conexus/connectors'
export type { ApprovalDeps, WriteAuthorOf, WriteTarget } from './approval.ts'
export { mayApprove, mayLeaveAlone, mustAsk } from './approval.ts'
export type { KitRead, WriteShape } from './assistant-port.ts'
export { subjectsOf } from './catalog-subjects.ts'
export { connectionForCopy, connectionNamesOf } from './copy-port.ts'
/** The cut of what a read sends the model: the agents' app reads cut the same way (code C26). */
export { shaped } from './cut.ts'
export { fixedFieldsOf, operationLabel, roleKit } from './role-kit.ts'
export type { SessionScope } from './scope.ts'
export { TurnKey } from './scope.ts'
export type { LiveToolCall } from './tool-door.ts'
export { openText, uncertainText } from './write.ts'
export type { WriteRequest, Written } from './write-record.ts'
export { markOf } from './write-record.ts'
export type { Returned } from './wrote.ts'

/** What tests change: a shorter deadline, and the clock a write is dated by (production's is the machine's). */
export type ConnectorTuning = { callDeadlineMs?: number; now?: (() => Date) | undefined }

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
  /** The apps' door: who an app's call is, the version its session gets and its manifest. */
  door: AppDoorPort
  tuning?: ConnectorTuning
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
  const executor = createExecutor({
    fetch,
    origins,
    log: deps.log,
    now: deps.tuning?.now ?? (() => new Date()),
  })
  const limits = createLimits({ executor, log: deps.log })
  const routeDeps = {
    ...deps,
    sealKeys: deps.config.sealKeys,
    publicOrigin: deps.config.publicOrigin,
    apps,
    origins,
    executor,
    limits,
    log: deps.log,
    callDeadlineMs: deps.tuning?.callDeadlineMs ?? CALL_DEADLINE_MS,
  }
  const appCalls = createAppCalls(routeDeps, deps.door)
  // One door for the agents and the saved tools they call, so a turn's 50 reads count both.
  const assistant = createAssistantConnectors(routeDeps)
  const toolDoor = createToolDoor(assistant, deps.log)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerConnectionRoutes(app, routeDeps),
    edgeRoutes: (edge: FastifyInstance) => {
      registerAppCallRoutes(edge, appCalls)
      registerToolCallRoutes(edge, toolDoor)
    },
    /** What Publicar asks: what the Projeto may not read, then what the role of who publishes lacks (decision C1). */
    ungranted: ungrantedBy(deps.identity),
    /** What the Builder's tools and instructions read; the Builder wires it in U5. */
    builder: createBuilderConnectors(routeDeps),
    /** What the Assistant's tools and conversation scope read: the chosen connections of its place, read only (step 24.1, U1). */
    assistant,
    /** The saved tools' live calls (step 24.4): the agent opens one before it calls the edge. */
    tools: { open: toolDoor.open },
    /** What the Assistant's hand-off releases to the Projeto it made (step 24.3.2), as the grant route does. */
    grants: {
      may: (viewer: Parameters<typeof mayGrant>[1]) => mayGrant(routeDeps, viewer),
      grant: (input: OfGrant) => grant(routeDeps, input),
    },
    /** The copies' templates and their paged read (Capacidade 2, U2). */
    copies: createCopyPort(routeDeps),
    /** The Hub's end: every live token logged out before the database closes. */
    closeAll: limits.closeAll,
  })
}

/** The `reseal` command's work for the connections: every one on the key that seals. */
export function resealConnections(deps: { database: Database; sealKeys: SealKeys }) {
  return reseal(deps)
}
