import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { PersonId } from './identity.ts'
import { defineOperation } from './operation.ts'

/** The states of a company's connection to an outside system (founder, C1). */
export const CONNECTION_STATES = ['NEW', 'ACTIVE', 'NEEDS_REAUTH'] as const
export type ConnectionState = (typeof CONNECTION_STATES)[number]

export const ConnectionId = z.uuid().brand('ConnectionId')
export type ConnectionId = z.infer<typeof ConnectionId>

/** A connector of the kit's catalog, as the screen offers it: its fields by their labels. */
export const ConnectorEntry = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  fields: z.array(z.object({ name: z.string(), label: z.string(), maxLength: z.number().int() })),
})
export type ConnectorEntry = z.infer<typeof ConnectorEntry>

/** A connection as every member reads it: never a value of its credential (S41). */
export const Connection = z.object({
  id: ConnectionId,
  connector: z.string(),
  connectorVersion: z.string(),
  state: z.enum(CONNECTION_STATES),
  // null: who linked has left the company, and the connection stays the company's (C1).
  linkedBy: z.object({ id: PersonId, name: z.string() }).nullable(),
  linkedAt: z.iso.datetime(),
  testedAt: z.iso.datetime().nullable(),
})
export type Connection = z.infer<typeof Connection>

export const ConnectionList = z.object({
  connectors: z.array(ConnectorEntry),
  connections: z.array(Connection),
  mayManage: z.boolean(),
})
export type ConnectionList = z.infer<typeof ConnectionList>

export const TEST_OUTCOMES = [
  'READS',
  'REFUSED',
  'UNREADABLE',
  'NOTHING_TO_READ',
  'NOT_TESTED', // the test's whole deadline ran out before this item
] as const
export const TestCheck = z.object({
  id: z.string(),
  label: z.string(),
  subject: z.string(), // the subject's label, for the screen's one line per subject
  outcome: z.enum(TEST_OUTCOMES),
})
export type TestCheck = z.infer<typeof TestCheck>

/** What Testar answers, shown at that moment and never kept (the values read stay in the executor). */
export const TestResult = z.discriminatedUnion('result', [
  z.object({ result: z.literal('WORKING'), checks: z.array(TestCheck), connection: Connection }),
  z.object({ result: z.literal('AUTH_REFUSED'), connection: Connection }),
  z.object({ result: z.literal('UNREACHABLE'), connection: Connection }),
])
export type TestResult = z.infer<typeof TestResult>

/** The pasted fields, by the connector's names; the Hub checks them by the connector's own schema. */
const PastedCredential = z
  .record(z.string().max(64), z.string().max(4096))
  .refine((fields) => Object.keys(fields).length <= 8)

const InCompany = z.object({ companyId: CompanyId })
const OfConnection = InCompany.extend({ connectionId: ConnectionId })
const READ_FAILURES = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const

export const listConnections = defineOperation({
  id: 'listConnections',
  summary: 'Lists the connectors a company may link and its connections, with no credential.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/connections',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: ConnectionList },
  failures: READ_FAILURES,
})

export const linkConnection = defineOperation({
  id: 'linkConnection',
  summary:
    'Links the company to a connector by the fields it pastes, sealing them, with no call to the provider.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/connections',
  bodyLimit: 16 * 1024,
  input: {
    params: InCompany,
    body: z.object({ connector: z.string().max(64), credential: PastedCredential }),
  },
  attemptKey: true,
  success: { status: 201, body: z.object({ connection: Connection }) },
  failures: [
    ...READ_FAILURES,
    'CONNECTOR_UNKNOWN',
    'CONNECTION_CREDENTIAL_INVALID',
    'CONNECTION_EXISTS',
    'IDEMPOTENCY_CONFLICT',
  ],
})

/** How long Testar may take in all, from its first login: under the 100 s the Cloudflare edge allows (platform/http.ts). */
export const TEST_DEADLINE_MS = 80_000

export const testConnection = defineOperation({
  id: 'testConnection',
  summary:
    'Logs in to the provider with the sealed fields and reads once with each read operation.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/connections/{connectionId}/test',
  bodyLimit: 1024,
  input: { params: OfConnection },
  success: { status: 200, body: TestResult },
  failures: [...READ_FAILURES, 'CONNECTION_NOT_FOUND', 'SEAL_REFUSED'],
})

export const unlinkConnection = defineOperation({
  id: 'unlinkConnection',
  summary: 'Removes a connection and its sealed fields; removing it again answers the same.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/connections/{connectionId}',
  bodyLimit: 1024,
  input: { params: OfConnection },
  success: { status: 204 },
  failures: READ_FAILURES,
})
