import { ConnectorAnswer } from '@conexus/app-contract'
import { z } from 'zod'
import { HostLabel } from './address.ts'
import { ToolVersionId } from './agent-ids.ts'
import { InCompany } from './companies.ts'
import {
  CALL_DEADLINE_MS,
  CONNECTION_STATES,
  ConnectionId,
  ConnectorEntry,
  READ_FAILURES,
} from './connectors.ts'
import { ProjectId } from './library-ids.ts'
import { defineOperation } from './operation.ts'
import { ToolCallKey } from './tools.ts'

/** A Projeto's permission to read a connection: who gave it (null: they left) and when. */
export const Grant = z.object({ by: z.string().nullable(), at: z.iso.datetime() })
export type Grant = z.infer<typeof Grant>

/**
 * What the Projeto can do with a connection right now, decided by the server alone (the one rule of
 * `usable`): the release is the Projeto's permission and stays; whether it reads depends on the
 * connection working. A screen renders the kind and never decides it.
 */
export const ProjectAccess = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('READS'), grant: Grant }),
  z.object({ kind: z.literal('RELEASED_NOT_WORKING'), grant: Grant }),
  z.object({ kind: z.literal('NOT_RELEASED') }),
  z.object({ kind: z.literal('NOT_RELEASED_NOT_WORKING') }),
])
export type ProjectAccess = z.infer<typeof ProjectAccess>

/** The company's connections by connector, each with what the Projeto may do with it; `perProject` is the connector's. */
export const ProjectConnections = z.object({
  connectors: z.array(
    z.object({
      connector: ConnectorEntry.pick({
        id: true,
        name: true,
        logo: true,
        category: true,
        auth: true,
      }),
      perProject: z.enum(['one', 'many']),
      connections: z.array(
        z.object({
          id: ConnectionId,
          name: z.string(),
          state: z.enum(CONNECTION_STATES),
          account: z.object({ label: z.string() }).nullable(),
          access: ProjectAccess,
        }),
      ),
    }),
  ),
})
export type ProjectConnections = z.infer<typeof ProjectConnections>

const OfProject = InCompany.extend({ projectId: ProjectId })
const OfGrant = OfProject.extend({ connectionId: ConnectionId })

export const listProjectConnections = defineOperation({
  id: 'listProjectConnections',
  summary: "Lists the company's connections by connector with what the Projeto may read.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/connections',
  bodyLimit: 1024,
  input: { params: OfProject },
  success: { status: 200, body: ProjectConnections },
  failures: READ_FAILURES,
})

export const grantProjectConnection = defineOperation({
  id: 'grantProjectConnection',
  summary: 'Lets the Projeto read a connection, whole; granting it again answers the same grant.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/projects/{projectId}/connections/{connectionId}',
  bodyLimit: 1024,
  input: { params: OfGrant },
  success: { status: 200, body: z.object({ grant: Grant }) },
  failures: [
    ...READ_FAILURES,
    'CONNECTION_NOT_FOUND',
    'CONNECTION_NOT_WORKING',
    'PROJECT_CONNECTION_TAKEN',
  ],
})

export const revokeProjectConnection = defineOperation({
  id: 'revokeProjectConnection',
  summary: 'Takes the Projeto’s permission to read a connection; taking it again answers the same.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/projects/{projectId}/connections/{connectionId}',
  bodyLimit: 1024,
  input: { params: OfGrant },
  success: { status: 204 },
  failures: READ_FAILURES,
})

/** The most an answer to the dispatcher carries, the executor's own cap (`wire.ts`). */
export const APP_CONNECTOR_REPLY_BYTES = 2 * 1024 * 1024

const OnConnector = z.object({ host: HostLabel, connector: z.string().max(64) })
const APP_CALL_FAILURES = [
  'APP_SESSION_INVALID',
  'APP_ACCESS_REFUSED',
  'APP_NOT_FOUND',
  'APP_NOT_PUBLISHED',
  'DATABASE_UNAVAILABLE',
] as const

export const callAppConnector = defineOperation({
  id: 'callAppConnector',
  summary: "Reads through a connector for an app: the app's session, then the Projeto's grant.",
  access: 'edge',
  method: 'POST',
  path: '/api/app-connector-calls',
  bodyLimit: 64 * 1024,
  input: {
    body: OnConnector.extend({
      operation: z.string().max(64),
      connection: z.string().max(60).nullable(),
      input: z.unknown(),
      deadlineMs: z.int().min(1).max(CALL_DEADLINE_MS),
    }),
  },
  success: { status: 200, body: ConnectorAnswer },
  failures: APP_CALL_FAILURES,
})

export const listAppConnections = defineOperation({
  id: 'listAppConnections',
  summary: "Names the connections of a connector the app's Projeto may read.",
  access: 'edge',
  method: 'GET',
  path: '/api/app-connector-calls/connections',
  bodyLimit: 1024,
  input: { query: OnConnector },
  success: { status: 200, body: z.object({ names: z.array(z.string()) }) },
  failures: APP_CALL_FAILURES,
})

/**
 * What a saved tool's read answers the edge: the read's whole answer, a read the call may not make
 * (`NOT_DECLARED`: no live call by that key, another version's, or an operation the version did not
 * declare), the turn's 50 reads spent, or the connector's own refusals, as data (step 24.4).
 */
export const ToolDataAnswer = z.union([
  ConnectorAnswer,
  z.strictObject({ kind: z.enum(['NOT_DECLARED', 'CALLS_SPENT']) }),
])
export type ToolDataAnswer = z.infer<typeof ToolDataAnswer>

export const callToolConnector = defineOperation({
  id: 'callToolConnector',
  summary: "Reads through a connector for a saved tool's Worker, by the Hub's live call of it.",
  access: 'edge',
  method: 'POST',
  path: '/api/tool-connector-calls',
  bodyLimit: 64 * 1024,
  input: {
    body: z.object({
      toolVersionId: ToolVersionId,
      call: ToolCallKey,
      operation: z.string().max(64),
      input: z.unknown(),
      deadlineMs: z.int().min(1).max(CALL_DEADLINE_MS),
    }),
  },
  success: { status: 200, body: ToolDataAnswer },
  failures: ['DATABASE_UNAVAILABLE'],
})
