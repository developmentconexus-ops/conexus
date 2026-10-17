import { isValidCnpj } from '@brazilian-utils/brazilian-utils'
import { z } from 'zod'
import { CompanyId, CompanyName, InvitationId, Next, Page } from './companies.ts'
import { Email } from './identity.ts'
import { defineOperation } from './operation.ts'

/** A CNPJ as stored: 12 letters or digits and 2 check digits, upper case, without the mask. */
const CNPJ_FORMAT = /^[0-9A-Z]{12}[0-9]{2}$/
const StoredCnpj = z.string().regex(CNPJ_FORMAT)

/**
 * A CNPJ as typed, mask and lower case allowed. Since July 2026 the Receita issues letters in the
 * first 12 positions, which the library's default `version: 1` refuses.
 */
export const Cnpj = z
  .string()
  .transform((typed) => typed.replace(/[./\s-]/g, '').toUpperCase())
  .pipe(StoredCnpj.refine((cnpj) => isValidCnpj(cnpj, { version: 2 })))
  .brand('Cnpj')
export type Cnpj = z.infer<typeof Cnpj>

/** The longest legal name, in characters. */
export const LEGAL_NAME_MAX_LENGTH = 150
const LegalName = z.string().trim().min(1).max(LEGAL_NAME_MAX_LENGTH)

/** The last owner invitation of a client still awaiting its administrator. */
export const OwnerInvitation = z.object({
  id: InvitationId,
  email: Email,
  state: z.enum(['PENDING', 'EXPIRED', 'DECLINED', 'CANCELED']),
  expiresAt: z.iso.datetime(),
  revision: z.number().int().nonnegative(),
})
export type OwnerInvitation = z.infer<typeof OwnerInvitation>

const AwaitingOwner = z.object({
  kind: z.literal('AWAITING_OWNER'),
  ownerInvitation: OwnerInvitation,
})
const Active = z.object({ kind: z.literal('ACTIVE'), activeSince: z.iso.datetime() })
const Owner = z.object({ name: z.string().min(1), email: Email })

/** A client of Conexus: its record, and the company's name and state, which identity owns. */
export const ClientSummary = z.object({
  companyId: CompanyId,
  cnpj: StoredCnpj,
  legalName: z.string().min(1),
  name: z.string().min(1),
  registeredAt: z.iso.datetime(),
  state: z.discriminatedUnion('kind', [AwaitingOwner, Active]),
})
export type ClientSummary = z.infer<typeof ClientSummary>

/** One client, with the revision a correction sends back and, once active, its current owners. */
export const Client = ClientSummary.extend({
  revision: z.number().int().nonnegative(),
  state: z.discriminatedUnion('kind', [
    AwaitingOwner,
    Active.extend({ owners: z.array(Owner).min(1) }),
  ]),
})
export type Client = z.infer<typeof Client>

const ClientData = z.object({ cnpj: Cnpj, legalName: LegalName, name: CompanyName })
const OfClient = z.object({ companyId: CompanyId })

export const listClients = defineOperation({
  id: 'listClients',
  summary: 'Lists the clients registered in the Operations Central, for the operator.',
  access: 'session',
  method: 'GET',
  path: '/api/clients',
  bodyLimit: 1024,
  input: { query: Page },
  success: { status: 200, body: z.object({ clients: z.array(ClientSummary), next: Next }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const getClient = defineOperation({
  id: 'getClient',
  summary: 'Reads one client of the Operations Central, for the operator.',
  access: 'session',
  method: 'GET',
  path: '/api/clients/{companyId}',
  bodyLimit: 1024,
  input: { params: OfClient },
  success: { status: 200, body: z.object({ client: Client }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const registerClient = defineOperation({
  id: 'registerClient',
  summary:
    'Registers a client company with no member and invites its administrator as first owner.',
  access: 'session',
  method: 'POST',
  path: '/api/clients',
  bodyLimit: 4096,
  input: { body: ClientData.extend({ ownerEmail: Email }) },
  attemptKey: true,
  // `mailBounced`: the client is registered, and the provider refused its administrator's address
  // on this answer; the operator invites another e-mail from the client.
  success: { status: 201, body: z.object({ client: Client, mailBounced: z.boolean() }) },
  failures: [
    'NOT_FOUND',
    'CLIENT_EXISTS',
    'CLIENT_OWNER_IS_OPERATOR',
    'IDEMPOTENCY_CONFLICT',
    'MAIL_UNAVAILABLE',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const correctClient = defineOperation({
  id: 'correctClient',
  summary: 'Corrects a client’s data while it still awaits its administrator.',
  access: 'session',
  method: 'PUT',
  path: '/api/clients/{companyId}',
  bodyLimit: 1024,
  input: {
    params: OfClient,
    body: ClientData.extend({ revision: z.number().int().nonnegative() }),
  },
  success: { status: 200, body: z.object({ client: Client }) },
  failures: [
    'NOT_FOUND',
    'CLIENT_EXISTS',
    'CLIENT_ACTIVE',
    'CLIENT_STALE',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const deleteClient = defineOperation({
  id: 'deleteClient',
  summary: 'Deletes a client with its company, members and invitations; its people stay.',
  access: 'session',
  method: 'DELETE',
  path: '/api/clients/{companyId}',
  bodyLimit: 1024,
  input: {
    params: OfClient,
    body: z.object({ name: z.string(), revision: z.number().int().nonnegative() }),
  },
  success: { status: 204 },
  failures: [
    'NOT_FOUND',
    'CLIENT_STALE',
    'CLIENT_NAME_MISMATCH',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})
