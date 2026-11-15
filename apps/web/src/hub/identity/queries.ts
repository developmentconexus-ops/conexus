import type { CompanyId, InvitationId, ListedInvitation, Member } from '@conexus/hub-api'
import {
  acceptInvitation,
  CAPACITY,
  cancelInvitation,
  changeMemberRole,
  createInvitation,
  createInvitationPassword,
  createRole,
  createSession,
  declineInvitation,
  deleteRole,
  deleteSession,
  getCompany,
  getInvitation,
  getSession,
  listCompanies,
  listCompanyAppAccess,
  listInvitations,
  listMembers,
  listMyApps,
  listRoles,
  removeMember,
  renewInvitation,
  requestPasswordRecovery,
  revokeAllAppAccess,
  setCompanyNickname,
  setMemberProfile,
  setPassword,
  updateRole,
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
/**
 * Every member of a company, page after page up to the company's capacity, for a screen that
 * names or picks people and cannot stop at the first page.
 */
export function everyMemberQuery(companyId: CompanyId) {
  const first = membersQuery(companyId, undefined)
  return {
    queryKey: [...hubQueryPrefix(listMembers, { companyId }), 'every'],
    queryFn: async (context: Parameters<typeof first.queryFn>[0]) => {
      const members: Member[] = []
      let page: string | undefined
      do {
        const read = await membersQuery(companyId, page).queryFn(context)
        members.push(...read.members)
        page = read.next.kind === 'MORE' ? read.next.page : undefined
      } while (page !== undefined && members.length < CAPACITY.members)
      return members
    },
  }
}
export function companyAppAccessQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listCompanyAppAccess, { params: { companyId }, query: { page } })
}
export const myAppsQuery = hubQuery(listMyApps)
export const revokeEveryApp = hubMutation(revokeAllAppAccess)
export function invitationsQuery(companyId: CompanyId, page: string | undefined) {
  return hubQuery(listInvitations, { params: { companyId }, query: { page } })
}
/** Every open invitation of the company, all the pages of the list, for what must not miss one. */
export function everyInvitationQuery(companyId: CompanyId) {
  return {
    queryKey: [...hubQueryPrefix(listInvitations, { companyId }), 'every'],
    queryFn: async (context: Parameters<ReturnType<typeof invitationsQuery>['queryFn']>[0]) => {
      const invitations: ListedInvitation[] = []
      let page: string | undefined
      do {
        const read = await invitationsQuery(companyId, page).queryFn(context)
        invitations.push(...read.invitations)
        page = read.next.kind === 'MORE' ? read.next.page : undefined
      } while (page !== undefined && invitations.length < CAPACITY.openInvitations)
      return invitations
    },
  }
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

export function rolesQuery(companyId: CompanyId) {
  return hubQuery(listRoles, { params: { companyId } })
}
export const createCompanyRole = hubMutation(createRole)
export const changeCompanyRole = hubMutation(updateRole)
export const deleteCompanyRole = hubMutation(deleteRole)

export const removePerson = hubMutation(removeMember)
export const changePersonRole = hubMutation(changeMemberRole)
export const writeMemberProfile = hubMutation(setMemberProfile)

/** What the cache holds of a company the person has left: its page, its people and its invitations. */
export function forgetCompany(queryClient: QueryClient, companyId: CompanyId): void {
  for (const read of [getCompany, listMembers, listInvitations]) {
    queryClient.removeQueries({ queryKey: hubQueryPrefix(read, { companyId }) })
  }
}
