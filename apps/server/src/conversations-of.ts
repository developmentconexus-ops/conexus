import type { FastifyInstance } from 'fastify'
import type { AppDataPort } from './builder/agents/public.ts'
import { agentsAlive } from './builder/agents/public.ts'
import type { HandOffDoors, MachineTuning } from './builder/assistant/public.ts'
import { createAssistant, speakersOf } from './builder/assistant/public.ts'
import {
  AUTOMATION_TURN_MS,
  AUTOMATION_WORKFLOW,
  automationRun,
  automationsOf,
} from './builder/automations/public.ts'
import { appTablesOf, createConstrutor } from './builder/construtor/public.ts'
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
import type { ProjectPorts } from './hub/projects/public.ts'
import { liveProjectIdsOf, liveProjectOf, liveProjectsOf } from './hub/projects/public.ts'
import type { Config } from './platform/config.ts'
import type { Database, MastraPool } from './platform/database.ts'
import type { FailureLog } from './platform/failure.ts'
import type { SealKeys } from './platform/seal.ts'

/** The connectors' assistant door, reached when a route or a turn calls it. */
function doorOf(connectors: () => Connectors): Connectors['assistant'] {
  return {
    connections: (scope) => connectors().assistant.connections(scope),
    read: (scope, call) => connectors().assistant.read(scope, call),
    notes: (scope, connectionId) => connectors().assistant.notes(scope, connectionId),
    operationOf: (scope, target) => connectors().assistant.operationOf(scope, target),
  }
}

/** The apps' door as the agents and the Construtor read the app's data (step 24.3): reached when called. */
function appDataOf(apps: () => Pick<Apps, 'hasAppData' | 'readAppData'>): AppDataPort {
  return {
    hasApp: (input) => apps().hasAppData(input),
    read: (input) => apps().readAppData(input),
  }
}

/** The Assistant's hand-off doors (step 24.3.2), each reached when the person touches it. */
function handOffsOf(
  deps: {
    projects: () => Pick<ProjectPorts, 'createProject'>
    connectors: () => Connectors
  },
  builder: HandOffDoors['builder'],
  updating: () => boolean,
): HandOffDoors {
  return {
    createProject: (input) => deps.projects().createProject(input),
    grants: deps.connectors().grants,
    builder,
    updating,
  }
}

/**
 * The Builder's conversations, the Assistant beside them (step 24.1, U2, `H1`), its automations
 * (step 24.2) and a Projeto's agents with their conversations (step 24.3): one Mastra store on the pool of Mastra's own login (0010) and one account queue,
 * shared by both controllers. The connectors are made after the apps whose door they read, and a
 * turn comes long after: each door is reached when called. The automations' run is made before the
 * one `Mastra` it is registered on, and the automations after it, on its schedules; a run and a
 * removal come long after both. The Construtor (step 24.3, U4) builds the agents through their
 * service and lists the automations made below.
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
  /** The Projects are made after the conversations; a hand-off creates one when it is touched. */
  projects: () => Pick<ProjectPorts, 'createProject'>
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
  const door = doorOf(deps.connectors)
  const assistant = createAssistant({
    ...{ storage, database, identity, queue, log },
    machine: deps.machine,
    machineTuning: deps.machineTuning,
    connectors: door,
    projects: { liveProjectOf, liveProjectsOf, publishedVersionsOf },
    handOffs: () => handOffsOf(deps, builder.handOffs, hub.updating),
  })
  // A Projeto's agents and the company's tools (step 24.3), each published one alive on the one
  // `Mastra`, made below: the connectors' door is reached when a route or a turn calls it.
  const appData = appDataOf(deps.apps)
  const agents = agentsAlive({
    ...{ storage, database, identity, queue, liveProjectOf, liveProjectIdsOf, isChoosable, log },
    connectors: door,
    speakersOf: (scope) => speakersOf({ database, identity, projects: { liveProjectOf } }, scope),
    appData,
    mastra: () => hub.mastra,
  })
  const construtor = createConstrutor({
    ...{ storage, database, identity, queue, liveProjectOf, log, agents, connectors: door },
    speakersOf: (scope) => speakersOf({ database, identity, projects: { liveProjectOf } }, scope),
    ...{ automations: () => automations, appTables: appTablesOf(appData) },
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
  // Assistant's, the agents' and the Construtor's; the Builder's part closes first, as it owns the open streams and
  // the runs.
  const hub = createHubMastra({
    ...{ storage, log, parts: [builder.part, assistant.part, agents.part, construtor.part] },
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
    routes: (app: FastifyInstance) => {
      builder.routes(app, hub)
      construtor.routes(app)
    },
  })
  const automations = automationsOf({
    ...{ mastra: hub.mastra, assistant, log, bootedAt: Date.now() },
    connectors: { connections: (scope) => deps.connectors().assistant.connections(scope) },
    updating: hub.updating,
  })
  return { conversations, assistant, automations, agents }
}
