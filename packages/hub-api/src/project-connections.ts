import { ConnectorAnswer } from '@conexus/app-contract'
import { z } from 'zod'
import { HostLabel } from './address.ts'
import { InCompany } from './companies.ts'
import {
  CALL_DEADLINE_MS,
  CONNECTION_STATES,
  ConnectionId,
  ConnectorEntry,
  OfConnection,
  READ_FAILURES,
} from './connectors.ts'
import { defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/** A Projeto's permission to read a connection: who gave it (null: they left) and when. */
export const Grant = z.object({ by: z.string().nullable(), at: z.iso.datetime() })
export type Grant = z.infer<typeof Grant>

/** The company's connections by connector, each with its grant to the Projeto; `perProject` is the connector's. */
export const ProjectConnections = z.object({
  connectors: z.array(
    z.object({
      connector: ConnectorEntry.pick({ id: true, name: true, logo: true, category: true, auth: true }),
      perProject: z.enum(['one', 'many']),
      connections: z.array(
        z.object({
          id: ConnectionId,
          name: z.string(),
          state: z.enum(CONNECTION_STATES),
          account: z.object({ label: z.string() }).nullable(),
          grant: Grant.nullable(),
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
  failures: [...READ_FAILURES, 'CONNECTION_NOT_FOUND', 'PROJECT_CONNECTION_TAKEN'],
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

export const deleteConnectionNote = defineOperation({
  id: 'deleteConnectionNote',
  summary:
    "Erases one of the Builder's notes about a connection; erasing it again answers the same.",
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/connections/{connectionId}/notes/{concept}',
  bodyLimit: 1024,
  input: { params: OfConnection.extend({ concept: z.string().min(1).max(120) }) },
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
