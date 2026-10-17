import type { CompanyId } from '@conexus/hub-api'
import {
  correctClient,
  createInvitation,
  deleteClient,
  getClient,
  listClients,
  registerClient,
  renewInvitation,
} from '@conexus/hub-api'
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
