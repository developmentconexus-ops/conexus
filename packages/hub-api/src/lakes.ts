import { z } from 'zod'
import { CompanyId, CompanyName } from './companies.ts'
import { defineOperation } from './operation.ts'

const At = z.iso.datetime({ offset: true })

/**
 * A client's data lake as the Central shows it: the Hub's row, settled against the stack when it
 * was moving (card o-lago-da-empresa-nasce-e-some, decision A).
 */
export const ClientLake = z.discriminatedUnion('state', [
  z.object({ state: z.literal('NONE') }),
  z.object({ state: z.literal('CREATING'), since: At }),
  z.object({
    state: z.literal('READY'),
    bucket: z.string(),
    region: z.string(),
    readyAt: At,
    /** The lake was made by a recipe without the treatment's areas, `tratado` and `negocio`. */
    outdated: z.boolean(),
  }),
  z.object({ state: z.literal('FAILED'), code: z.literal('LAKE_CREATE_FAILED'), at: At }),
  z.object({ state: z.literal('DELETING'), since: At }),
  z.object({ state: z.literal('DELETE_FAILED'), at: At }),
])
export type ClientLake = z.infer<typeof ClientLake>

const OfClient = z.object({ companyId: CompanyId })
const Answer = z.object({ lake: ClientLake })

export const getClientLake = defineOperation({
  id: 'getClientLake',
  summary: "Reads a client's data lake, for the operator; a moving one is read from its stack.",
  access: 'session',
  method: 'GET',
  path: '/api/clients/{companyId}/lake',
  bodyLimit: 1024,
  input: { params: OfClient },
  success: { status: 200, body: Answer },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createClientLake = defineOperation({
  id: 'createClientLake',
  summary:
    "Starts creating a client's data lake, for the operator; a second click answers the same.",
  access: 'session',
  method: 'POST',
  path: '/api/clients/{companyId}/lake',
  bodyLimit: 1024,
  input: { params: OfClient },
  success: { status: 202, body: Answer },
  failures: ['NOT_FOUND', 'LAKE_BUSY', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const deleteClientLake = defineOperation({
  id: 'deleteClientLake',
  summary: "Starts deleting a client's data lake, at once and for good, by the company's name.",
  access: 'session',
  method: 'DELETE',
  path: '/api/clients/{companyId}/lake',
  bodyLimit: 1024,
  input: { params: OfClient, body: z.object({ name: CompanyName }) },
  success: { status: 202, body: Answer },
  failures: [
    'NOT_FOUND',
    'CLIENT_NAME_MISMATCH',
    'LAKE_BUSY',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})
