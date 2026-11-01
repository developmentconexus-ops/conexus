import { createAssistant } from './builder/assistant/public.ts'
import { createConversations, createMastraStorage } from './builder/conversation/public.ts'
import type { openGoogleCalls } from './builder/model-accounts/public.ts'
import type { AssistantMachine, Runs } from './builder/runs/public.ts'
import { versionNumbersOf } from './hub/apps/public.ts'
import type { Connectors } from './hub/connectors/public.ts'
import type { IdentityPorts } from './hub/identity/public.ts'
import { liveProjectOf, liveProjectsOf } from './hub/projects/public.ts'
import type { Database, MastraPool } from './platform/database.ts'
import type { FailureLog } from './platform/failure.ts'
import type { SealKeys } from './platform/seal.ts'

/**
 * The Builder's conversations and the Assistant beside them (step 24.1, U2, `H1`): one Mastra store
 * on the pool of Mastra's own login (0010) and one account queue, shared by both controllers. The
 * connectors are made after the apps whose door they read, and a turn comes long after: each door
 * is reached when called.
 */
export function conversationsOf(deps: {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  google: ReturnType<typeof openGoogleCalls>
  mastraPool: MastraPool
  runs: Runs
  machine: AssistantMachine
  connectors: () => Connectors
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
    connectors: {
      connections: (scope) => deps.connectors().assistant.connections(scope),
      read: (scope, call) => deps.connectors().assistant.read(scope, call),
      notes: (scope, connectionId) => deps.connectors().assistant.notes(scope, connectionId),
    },
    projects: { liveProjectOf, liveProjectsOf, versionNumbersOf },
  })
  const conversations = createConversations({
    ...{ database, identity, projects: { liveProjectOf }, google: deps.google, log },
    ...{ storage, queue, assistant, runs: deps.runs },
    connectors: {
      granted: (ids) => deps.connectors().builder.granted(ids),
      read: (ids, a) => deps.connectors().builder.read(ids, a),
      notes: (ids, connectionId) => deps.connectors().builder.notes(ids, connectionId),
      saveNote: (ids, a) => deps.connectors().builder.saveNote(ids, a),
    },
  })
  return { conversations, assistant }
}
