import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ConnectorEntry, Native, READ_FAILURES } from './connectors.ts'
import { defineOperation } from './operation.ts'

/** How long a link for another person lives: the `connect_link` of Nango's 30 minutes. */
export const CONNECTION_LINK_MINUTES = 30

/** A link's row; the secret in its address is never an id, the row is found by the digest of it (C23). */
export const ConnectionLinkId = z.uuid().brand('ConnectionLinkId')
export type ConnectionLinkId = z.infer<typeof ConnectionLinkId>

/** The fields by their names, a value each; the Hub checks them by the connector's own schema. */
const Fields = z
  .record(z.string().max(64), z.string().max(4096))
  .refine((fields) => Object.keys(fields).length <= 8)

/** The address to hand to the other person, given once, and when it stops working. */
export const ConnectionLink = z.object({ url: z.url(), expiresAt: z.iso.datetime() })
export type ConnectionLink = z.infer<typeof ConnectionLink>

/** A field the other person fills, as the kit declares it. */
const AskedField = ConnectorEntry.shape.fields.element

/** What the public page shows: who asked, the company, the system, and only the fields asked, never a value already given. */
export const ConnectionLinkPage = z.object({
  askedBy: z.string(),
  company: z.string(),
  system: z.object({ name: z.string(), logo: z.string() }),
  fields: z.array(AskedField),
})
export type ConnectionLinkPage = z.infer<typeof ConnectionLinkPage>

/** How the one test of a link's send ended; the connection is never shown, the person has no session. */
export const ConnectionLinkAnswered = z.discriminatedUnion('result', [
  z.object({ result: z.literal('WORKING') }),
  z.object({ result: z.enum(['AUTH_REFUSED', 'UNREADABLE', 'APP_REFUSED']), native: Native }),
  z.object({ result: z.literal('READ_REFUSED'), read: z.string(), native: Native }),
  z.object({ result: z.literal('UNREACHABLE'), native: Native.nullable() }),
  z.object({
    result: z.literal('BUSY'),
    native: Native,
    waitMs: z.number().int().nonnegative().nullable(),
  }),
])
export type ConnectionLinkAnswered = z.infer<typeof ConnectionLinkAnswered>

const OfSecret = z.object({ secret: z.string().min(1).max(128) })

export const createConnectionLink = defineOperation({
  id: 'createConnectionLink',
  summary:
    'Makes the link another person opens to fill the fields of a new connection by fields, and gives its address once.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/connection-links',
  bodyLimit: 16 * 1024,
  input: {
    params: z.object({ companyId: CompanyId }),
    body: z.strictObject({
      connector: z.string().max(64),
      name: z.string().max(240),
      asked: z.array(z.string().max(64)).min(1).max(8),
      filled: Fields,
    }),
  },
  success: { status: 201, body: ConnectionLink },
  failures: [
    ...READ_FAILURES,
    'CONNECTOR_UNKNOWN',
    'CONNECTION_CREDENTIAL_INVALID',
    'CONNECTION_NAME_INVALID',
    'LINK_NOT_FOR_SIGN_IN',
  ],
})

export const readConnectionLink = defineOperation({
  id: 'readConnectionLink',
  summary: 'Reads the page of a link by its secret, with no session.',
  access: 'public',
  method: 'GET',
  path: '/api/connection-links/{secret}',
  bodyLimit: 1024,
  input: { params: OfSecret },
  success: { status: 200, body: ConnectionLinkPage },
  failures: ['NOT_FOUND', 'SIGN_IN_ATTEMPTS_EXCEEDED', 'DATABASE_UNAVAILABLE'],
})

export const answerConnectionLink = defineOperation({
  id: 'answerConnectionLink',
  summary:
    'Sends the fields a link asks, with no session: creates the connection for whoever asked and tests it once.',
  access: 'entry',
  method: 'POST',
  path: '/api/connection-links/{secret}',
  bodyLimit: 16 * 1024,
  input: { params: OfSecret, body: z.strictObject({ fields: Fields }) },
  success: { status: 200, body: ConnectionLinkAnswered },
  failures: [
    'NOT_FOUND',
    'SIGN_IN_ATTEMPTS_EXCEEDED',
    'CONNECTION_CREDENTIAL_INVALID',
    'CONNECTION_NAME_TAKEN',
    'SEAL_REFUSED',
    'DATABASE_UNAVAILABLE',
  ],
})
