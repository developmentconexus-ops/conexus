import type { ClientLake, CompanyId } from '@conexus/hub-api'
import {
  correctClient,
  createClientLake,
  createInvitation,
  deleteClient,
  deleteClientLake,
  getClient,
  getClientLake,
  listClients,
  registerClient,
  renewInvitation,
} from '@conexus/hub-api'
import { queryOptions } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

export function clientsQuery(page: string | undefined) {
  return hubQuery(listClients, { query: { page } })
}
/** Every page of the Central's list. */
export const allClientsQueryKey = hubQueryPrefix(listClients)
export function clientQuery(companyId: CompanyId) {
  return hubQuery(getClient, { params: { companyId } })
}

export const sendRegistration = hubMutation(registerClient)
export const sendCorrection = hubMutation(correctClient)
export const sendDeletion = hubMutation(deleteClient)
// The owner's invitation is step 4.1's, through the same operations the company page uses; its
// cancellation is identity's own confirmation.
export const inviteOwner = hubMutation(createInvitation)
export const renewOwnerInvitation = hubMutation(renewInvitation)

/** How often a lake being created or deleted is read again: the Hub settles it against its stack. */
const WHILE_MOVING = 5_000

/** A lake CloudFormation is still making or taking away. */
function isMoving(lake: ClientLake | undefined): boolean {
  return lake?.state === 'CREATING' || lake?.state === 'DELETING'
}

/** The client's data lake, read again every 5 s while it moves (card o-lago-da-empresa-nasce-e-some). */
export function clientLakeQuery(companyId: CompanyId) {
  return queryOptions({
    ...hubQuery(getClientLake, { params: { companyId } }),
    refetchInterval: (query) => (isMoving(query.state.data?.lake) ? WHILE_MOVING : false),
  })
}

// The lake's writes set the block from the Hub's answer, and a refused one leaves the state before
// under the Hub's phrase (criteria 63 and 67): they keep the cache the others refresh (web W12).
const KEEP_CACHE = { keepCache: true } as const
export const sendLakeCreation = { ...hubMutation(createClientLake), meta: KEEP_CACHE }
export const sendLakeDeletion = { ...hubMutation(deleteClientLake), meta: KEEP_CACHE }
