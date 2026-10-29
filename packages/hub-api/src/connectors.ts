import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { PersonId } from './identity.ts'
import { defineOperation } from './operation.ts'

/** The states of a company's connection to an outside system (founder, C1). */
export const CONNECTION_STATES = ['NEW', 'ACTIVE', 'NEEDS_REAUTH'] as const
export type ConnectionState = (typeof CONNECTION_STATES)[number]

export const ConnectionId = z.uuid().brand('ConnectionId')
export type ConnectionId = z.infer<typeof ConnectionId>

/** A connector of the kit's catalog, as the screen offers it: its fields by their labels, help and visibility. */
export const ConnectorEntry = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  category: z.string(),
  summary: z.string(),
  // The kit's SVG, shown by the screen as a data: image.
  logo: z.string(),
  // What one Testar reads: the read door's entries plus the operations, counted from the definition.
  reads: z.number().int(),
  fields: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
      maxLength: z.number().int(),
      help: z.object({ text: z.string(), url: z.url() }),
      visible: z.boolean(),
    }),
  ),
})
export type ConnectorEntry = z.infer<typeof ConnectorEntry>

/** The name the company gives a connection at Ligar ("Matriz"): what tells two of a connector apart. */
export const ConnectionName = z.string().trim().min(1).max(60)

const Person = z.object({ id: PersonId, name: z.string() })

/** A connection as every member reads it: never a value of its credential (S41). */
export const Connection = z.object({
  id: ConnectionId,
  connector: z.string(),
  name: z.string(),
  connectorVersion: z.string(),
  state: z.enum(CONNECTION_STATES),
  // null: who linked has left the company, and the connection stays the company's (C1).
  linkedBy: Person.nullable(),
  linkedAt: z.iso.datetime(),
  testedAt: z.iso.datetime().nullable(),
  // null: nobody has tested it, or who tested has left the company.
  testedBy: Person.nullable(),
})
export type Connection = z.infer<typeof Connection>

export const ConnectionList = z.object({
  connectors: z.array(ConnectorEntry),
  connections: z.array(Connection),
  mayManage: z.boolean(),
})
export type ConnectionList = z.infer<typeof ConnectionList>

/** What the provider said, as it came (founder, 2026-10-29): its status, where its code and message sit, and its body with the request's secrets replaced. */
export const Native = z.object({
  status: z.number().int(),
  code: z.string().nullable(),
  message: z.string().nullable(),
  body: z.unknown(),
})
export type Native = z.infer<typeof Native>

const Item = z.object({
  id: z.string(),
  label: z.string(),
  subject: z.string(), // the subject's label, for the screen's one line per subject
})

/** One item of a test, by what its call came to; `native` is on the items the provider answered badly. */
function checkOf<N extends z.ZodType>(native: N) {
  return z.discriminatedUnion('outcome', [
    // NOT_TESTED: the test's whole deadline ran out before this item.
    Item.extend({ outcome: z.enum(['READS', 'NOTHING_TO_READ', 'NOT_TESTED']) }),
    Item.extend({ outcome: z.enum(['REFUSED', 'UNREADABLE']), native }),
    // Not called: a source it reads from did not read; `source` is that source's label.
    Item.extend({ outcome: z.literal('SOURCE_UNREAD'), source: z.string() }),
  ])
}
export const TestCheck = checkOf(Native)
export type TestCheck = z.infer<typeof TestCheck>

/** A test item as it is kept (every member reads it): the status and code only, never the body or the message. */
export const KeptCheck = checkOf(Native.pick({ status: true, code: true }))
export type KeptCheck = z.infer<typeof KeptCheck>

/** What Testar answers, shown at that moment (the values read stay in the executor; what the provider said about a refusal is shown, never kept whole). */
export const TestResult = z.discriminatedUnion('result', [
  z.object({ result: z.literal('WORKING'), checks: z.array(TestCheck), connection: Connection }),
  // The test ended on the provider's own answer: `native` is what it said (null: it said nothing, as a timeout).
  z.object({ result: z.literal('AUTH_REFUSED'), native: Native, connection: Connection }),
  z.object({ result: z.literal('UNREADABLE'), native: Native, connection: Connection }),
  z.object({ result: z.literal('UNREACHABLE'), native: Native.nullable(), connection: Connection }),
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
    body: z.object({
      connector: z.string().max(64),
      name: z.string(),
      credential: PastedCredential,
    }),
  },
  attemptKey: true,
  success: { status: 201, body: z.object({ connection: Connection }) },
  failures: [
    ...READ_FAILURES,
    'CONNECTOR_UNKNOWN',
    'CONNECTION_CREDENTIAL_INVALID',
    'CONNECTION_NAME_INVALID',
    'CONNECTION_NAME_TAKEN',
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

/** One connection with its last WORKING test, kept: the items only, never a value read (founder, X2). */
export const ConnectionDetail = z.object({
  connection: Connection,
  lastTest: z.array(KeptCheck).nullable(),
})
export type ConnectionDetail = z.infer<typeof ConnectionDetail>

export const getConnection = defineOperation({
  id: 'getConnection',
  summary: 'Reads one connection and the items of its last working test, with no credential.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/connections/{connectionId}',
  bodyLimit: 1024,
  input: { params: OfConnection },
  success: { status: 200, body: ConnectionDetail },
  failures: [...READ_FAILURES, 'CONNECTION_NOT_FOUND'],
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
