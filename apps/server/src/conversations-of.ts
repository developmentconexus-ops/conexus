import { agentsOf } from './builder/agents/public.ts'
import type { MachineTuning } from './builder/assistant/public.ts'
import { createAssistant } from './builder/assistant/public.ts'
import {
  AUTOMATION_TURN_MS,
  AUTOMATION_WORKFLOW,
  automationRun,
  automationsOf,
} from './builder/automations/public.ts'
import { createConversations, createMastraStorage } from './builder/conversation/public.ts'
import type { openGoogleCalls } from './builder/model-accounts/public.ts'
import { isChoosable } from './builder/model-accounts/public.ts'
import type { AssistantMachine, Runs } from './builder/runs/public.ts'
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
 * (step 24.2) and a Projeto's agents (step 24.3): one Mastra store on the pool of Mastra's own login (0010) and one account queue,
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
  const assistant = createAssistant({
    ...{ storage, database, identity, queue, log },
    machine: deps.machine,
    machineTuning: deps.machineTuning,
    connectors: {
      connections: (scope) => deps.connectors().assistant.connections(scope),
      read: (scope, call) => deps.connectors().assistant.read(scope, call),
      notes: (scope, connectionId) => deps.connectors().assistant.notes(scope, connectionId),
      operationOf: (scope, target) => deps.connectors().assistant.operationOf(scope, target),
    },
    projects: { liveProjectOf, liveProjectsOf, publishedVersionsOf },
  })
  // A Projeto's agents and the company's tools (step 24.3): the connectors' door is reached when a
  // route calls it, long after the connectors are made.
  const agents = agentsOf({
    ...{ database, identity, liveProjectOf, isChoosable, log },
    connectors: {
      connections: (scope) => deps.connectors().assistant.connections(scope),
      operationOf: (scope, target) => deps.connectors().assistant.operationOf(scope, target),
    },
  })
  const clock = deps.automationClock
  const run = automationRun({
    ...{ assistant, notify: deps.notify, log },
    updating: () => conversations.updating(),
    turnMs: clock?.turnMs ?? AUTOMATION_TURN_MS,
  })
  const conversations = createConversations({
    ...{ database, identity, projects: { liveProjectOf }, google: deps.google, log },
    ...{ storage, queue, assistant, runs: deps.runs },
    automation: {
      workflows: { [AUTOMATION_WORKFLOW]: run },
      schedulerTickMs: clock?.schedulerTickMs,
      release: (scope) => automations.release(scope),
    },
    agents,
    connectors: {
      granted: (ids) => deps.connectors().builder.granted(ids),
      read: (ids, a) => deps.connectors().builder.read(ids, a),
      notes: (ids, connectionId) => deps.connectors().builder.notes(ids, connectionId),
      saveNote: (ids, a) => deps.connectors().builder.saveNote(ids, a),
    },
  })
  const automations = automationsOf({
    ...{ mastra: conversations.mastra, assistant, log, bootedAt: Date.now() },
    connectors: { connections: (scope) => deps.connectors().assistant.connections(scope) },
    updating: conversations.updating,
  })
  return { conversations, assistant, automations, agents }
}
