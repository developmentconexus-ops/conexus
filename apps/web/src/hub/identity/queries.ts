import type { CompanyId, InvitationId } from '@conexus/hub-api'
import {
  acceptInvitation,
  cancelInvitation,
  changeMemberRole,
  createInvitation,
  createInvitationPassword,
  createSession,
  declineInvitation,
  deleteSession,
  getCompany,
  getInvitation,
  getSession,
  listCompanies,
  listInvitations,
  listMembers,
  removeMember,
  renewInvitation,
  requestPasswordRecovery,
  setCompanyNickname,
  setPassword,
} from '@conexus/hub-api'
import type { QueryClient } from '@tanstack/react-query'
import { hubMutation, hubQuery, hubQueryPrefix } from '../../platform/hub.ts'

// A session write replaces the cache itself (web W28), so it keeps the cache the others refresh.
const KEEP_CACHE = { keepCache: true } as const

export const sessionQuery = hubQuery(getSession)
export const signIn = { ...hubMutation(createSession), meta: KEEP_CACHE }
export const signOut = { ...hubMutation(deleteSession), meta: KEEP_CACHE }
export const choosePassword = hubMutation(setPassword)
export const requestRecovery = hubMutation(requestPasswordRecovery)

export function companiesQuery(page: string | undefined) {
  return hubQuery(listCompanies, { query: { page } })
}
export function companyQuery(companyId: CompanyId) {
  return hubQuery(getCompany, { params: { companyId } })
}
export function membersQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listMembers, { params: { companyId }, query: { page } })
}
export function invitationsQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listInvitations, { params: { companyId }, query: { page } })
}
export function receivedInvitationQuery(invitationId: InvitationId) {
  return hubQuery(getInvitation, { params: { invitationId } })
}

export const chooseNickname = hubMutation(setCompanyNickname)
export const inviteToCompany = hubMutation(createInvitation)
export const cancelCompanyInvitation = hubMutation(cancelInvitation)
export const renewCompanyInvitation = hubMutation(renewInvitation)
export const createReceivedPassword = { ...hubMutation(createInvitationPassword), meta: KEEP_CACHE }
export const declineReceivedInvitation = hubMutation(declineInvitation)
export const acceptReceivedInvitation = hubMutation(acceptInvitation)

export const removePerson = hubMutation(removeMember)
export const changePersonRole = hubMutation(changeMemberRole)

/** What the cache holds of a company the person has left: its page, its people and its invitations. */
export function forgetCompany(queryClient: QueryClient, companyId: CompanyId): void {
  for (const read of [getCompany, listMembers, listInvitations]) {
    queryClient.removeQueries({ queryKey: hubQueryPrefix(read, { companyId }) })
  }
}
