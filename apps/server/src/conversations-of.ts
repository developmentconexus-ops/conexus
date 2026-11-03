import type { FastifyInstance } from 'fastify'
import { agentsAlive } from './builder/agents/public.ts'
import type { MachineTuning } from './builder/assistant/public.ts'
import { createAssistant, speakersOf } from './builder/assistant/public.ts'
import {
  AUTOMATION_TURN_MS,
  AUTOMATION_WORKFLOW,
  automationRun,
  automationsOf,
} from './builder/automations/public.ts'
import { createBuilderConversations, createMastraStorage } from './builder/conversation/public.ts'
import { createHubMastra } from './builder/mastra/public.ts'
import type { openGoogleCalls } from './builder/model-accounts/public.ts'
import { isChoosable } from './builder/model-accounts/public.ts'
import type { AssistantMachine, Runs } from './builder/runs/public.ts'
import type { Apps } from './hub/apps/public.ts'
import { publishedVersionsOf } from './hub/apps/public.ts'
import type { Connectors } from './hub/connectors/public.ts'
import type { IdentityPorts } from './hub/identity/public.ts'
import type { Notify } from './hub/notifications/public.ts'
import { liveProjectOf, liveProjectsOf } from './hub/projects/public.ts'
import type { Config } from './platform/config.ts'
import type { Database, MastraPool } from './platform/database.ts'
import type { FailureLog } from './platform/failure.ts'
import type { SealKeys } from './platform/seal.ts'

/**
 * The Builder's conversations, the Assistant beside them (step 24.1, U2, `H1`), its automations
 * (step 24.2) and a Projeto's agents with their conversations (step 24.3): one Mastra store on the pool of Mastra's own login (0010) and one account queue,
 * shared by both controllers. The connectors are made after the apps whose door they read, and a
 * turn comes long after: each door is reached when called. The automations' run is made before the
 * one `Mastra` it is registered on, and the automations after it, on its schedules; a run and a
 * removal come long after both.
 */
export function conversationsOf(deps: {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  google: ReturnType<typeof openGoogleCalls>
  mastraPool: MastraPool
  runs: Runs
  machine: AssistantMachine
  /** The tests' folder and start deadline for the Assistant's machines; E2B's when absent. */
  machineTuning?: MachineTuning
  connectors: () => Connectors
  /** The apps are made after the agents; an agent reads its app's data when a turn calls it. */
  apps: () => Apps
  notify: Notify
  automationClock: Config['automationClock']
  log: FailureLog
}) {
  const { database, identity, log } = deps
  const storage = createMastraStorage(deps.mastraPool)
  const queue = {
    database,
    identity,
    sealKeys: deps.sealKeys,
    googleCalls: deps.google.googleCalls,
    log,
  }
  const door: Connectors['assistant'] = {
    connections: (scope) => deps.connectors().assistant.connections(scope),
    read: (scope, call) => deps.connectors().assistant.read(scope, call),
    notes: (scope, connectionId) => deps.connectors().assistant.notes(scope, connectionId),
    operationOf: (scope, target) => deps.connectors().assistant.operationOf(scope, target),
  }
  const assistant = createAssistant({
    ...{ storage, database, identity, queue, log },
    machine: deps.machine,
    machineTuning: deps.machineTuning,
    connectors: door,
    projects: { liveProjectOf, liveProjectsOf, publishedVersionsOf },
  })
  // A Projeto's agents and the company's tools (step 24.3), each published one alive on the one
  // `Mastra`, made below: the connectors' door is reached when a route or a turn calls it.
  const agents = agentsAlive({
    ...{ storage, database, identity, queue, liveProjectOf, isChoosable, log, connectors: door },
    speakersOf: (scope) => speakersOf({ database, identity, projects: { liveProjectOf } }, scope),
    appData: {
      hasApp: (input) => deps.apps().hasAppData(input),
      read: (input) => deps.apps().readAppData(input),
    },
    mastra: () => hub.mastra,
  })
  const clock = deps.automationClock
  const run = automationRun({
    ...{ assistant, notify: deps.notify, log },
    updating: () => hub.updating(),
    turnMs: clock?.turnMs ?? AUTOMATION_TURN_MS,
  })
  const builder = createBuilderConversations({
    ...{ database, identity, projects: { liveProjectOf }, log },
    ...{ storage, queue, runs: deps.runs },
    connectors: {
      granted: (ids) => deps.connectors().builder.granted(ids),
      read: (ids, a) => deps.connectors().builder.read(ids, a),
      notes: (ids, connectionId) => deps.connectors().builder.notes(ids, connectionId),
      saveNote: (ids, a) => deps.connectors().builder.saveNote(ids, a),
    },
  })
  // The order of removal: the automations, the agents, then the Builder's conversations, the
  // Assistant's and the agents'; the Builder's part closes first, as it owns the open streams and
  // the runs.
  const hub = createHubMastra({
    ...{ storage, log, parts: [builder.part, assistant.part, agents.part] },
    workflows: { [AUTOMATION_WORKFLOW]: run },
    schedulerTickMs: clock?.schedulerTickMs,
    releaseFirst: [
      (scope) => automations.release(scope),
      async (scope) => {
        await agents.release(scope)
      },
    ],
    closeLast: [() => deps.google.stop()],
  })
  const conversations = Object.freeze({
    ...hub,
    routes: (app: FastifyInstance) => builder.routes(app, hub),
  })
  const automations = automationsOf({
    ...{ mastra: hub.mastra, assistant, log, bootedAt: Date.now() },
    connectors: { connections: (scope) => deps.connectors().assistant.connections(scope) },
    updating: hub.updating,
  })
  return { conversations, assistant, automations, agents }
}

/** The conversations on the one `Mastra`, as `main.ts` starts, stops and routes them. */
export type Conversations = ReturnType<typeof conversationsOf>['conversations']
