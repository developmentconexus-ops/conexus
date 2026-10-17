import type { CompanyId } from '@conexus/hub-api'
import {
  correctClient,
  createInvitation,
  getClient,
  listClients,
  registerClient,
  renewInvitation,
} from '@conexus/hub-api'
import { hubMutation, hubQuery } from '../../platform/hub.ts'

export function clientsQuery(page: string | undefined) {
  return hubQuery(listClients, { query: { page } })
}
export function clientQuery(companyId: CompanyId) {
  return hubQuery(getClient, { params: { companyId } })
}

export const sendRegistration = hubMutation(registerClient)
export const sendCorrection = hubMutation(correctClient)
// The owner's invitation is step 4.1's, through the same operations the company page uses; its
// cancellation is identity's own confirmation.
export const inviteOwner = hubMutation(createInvitation)
export const renewOwnerInvitation = hubMutation(renewInvitation)
