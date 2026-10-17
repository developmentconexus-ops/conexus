import { z } from 'zod'
import { Email, Password, PersonId } from './identity.ts'
import { defineOperation } from './operation.ts'

export const LIBRARY_ID = /^[A-Za-z0-9]{32}$/

export const CompanyId = z.string().regex(LIBRARY_ID).brand('CompanyId')
export type CompanyId = z.infer<typeof CompanyId>

export const InvitationId = z.string().regex(LIBRARY_ID).brand('InvitationId')
export type InvitationId = z.infer<typeof InvitationId>

/** From the most privileged to the least; `mayInviteAs` and the invite form read this order. */
export const Role = z.enum(['owner', 'admin', 'member'])
export type Role = z.infer<typeof Role>

/** The Portuguese name of each role, on the screens and in the mail. */
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  member: 'Membro',
}

export const Company = z.object({ id: CompanyId, name: z.string().min(1) })
export type Company = z.infer<typeof Company>

export const Membership = z.object({ company: Company, role: Role })
export type Membership = z.infer<typeof Membership>

/**
 * A person of a company. `mayRemove` and `mayChangeTo` are what the viewer may do to this row, the
 * Hub's one answer (code C26); `invitationsSent` counts the invitations a removal would cancel.
 */
export const Member = z.object({
  personId: PersonId,
  name: z.string().min(1),
  email: Email,
  role: Role,
  mayRemove: z.boolean(),
  mayChangeTo: z.array(Role),
  invitationsSent: z.number().int().nonnegative(),
})
export type Member = z.infer<typeof Member>

export const PendingInvitation = z.object({
  state: z.literal('PENDING'),
  id: InvitationId,
  email: Email,
  role: Role,
  expiresAt: z.iso.datetime(),
  revision: z.number().int().nonnegative(),
})
export type PendingInvitation = z.infer<typeof PendingInvitation>

const InvitationState = z.enum(['PENDING', 'EXPIRED', 'ACCEPTED', 'DECLINED', 'CANCELED'])

/** A row of "Convites pendentes": whether it still opens is the Hub's clock, not the browser's. */
export const ListedInvitation = PendingInvitation.extend({
  state: InvitationState.extract(['PENDING', 'EXPIRED']),
})
export type ListedInvitation = z.infer<typeof ListedInvitation>

const OpenInvitation = z.object({
  company: Company,
  role: Role,
  inviterName: z.string().min(1),
  /** The company has no member yet: Conexus invites its first owner (step 4.2). */
  firstOwner: z.boolean(),
  expiresAt: z.iso.datetime(),
  revision: z.number().int().nonnegative(),
})
export const InvitationView = z.discriminatedUnion('kind', [
  OpenInvitation.extend({ kind: z.literal('NEW'), email: Email }),
  OpenInvitation.extend({ kind: z.literal('HAS_PASSWORD'), email: Email }),
  OpenInvitation.extend({ kind: z.literal('INVITED') }),
  z.object({ kind: z.literal('OTHER'), signedInAs: Email }),
  z.object({ kind: z.literal('CLOSED'), state: InvitationState.exclude(['PENDING']) }),
  z.object({ kind: z.literal('JOINED'), company: Company }),
])
export type InvitationView = z.infer<typeof InvitationView>

/** Where the next page starts, opaque to the client (code C44); only the Hub reads it. */
const PageToken = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)

/** A page of a list ends, or names the page that follows (code C41: never null). */
export const Next = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('END') }),
  z.object({ kind: z.literal('MORE'), page: PageToken }),
])
export type Next = z.infer<typeof Next>

/** Every list answers this many rows at most. */
export const PAGE_SIZE = 50

/** The longest company name, in characters. */
export const COMPANY_NAME_MAX_LENGTH = 100
export const CompanyName = z.string().trim().min(1).max(COMPANY_NAME_MAX_LENGTH)
const PersonName = z.string().trim().min(1).max(100)
export const Page = z.object({ page: PageToken.optional() })
const InCompany = z.object({ companyId: CompanyId })
const OfInvitation = z.object({ invitationId: InvitationId })

export const listCompanies = defineOperation({
  id: 'listCompanies',
  summary: 'Lists the companies the person belongs to, with the role in each.',
  access: 'session',
  method: 'GET',
  path: '/api/companies',
  bodyLimit: 1024,
  input: { query: Page },
  success: {
    status: 200,
    body: z.object({ companies: z.array(Membership), mayOperate: z.boolean(), next: Next }),
  },
  failures: ['SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const getCompany = defineOperation({
  id: 'getCompany',
  summary: 'Reads a company the person belongs to, the role and the roles it may invite as.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: {
    status: 200,
    body: z.object({ company: Company, role: Role, mayInviteAs: z.array(Role) }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const listMembers = defineOperation({
  id: 'listMembers',
  summary: 'Lists the people of a company the person belongs to.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/members',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: { status: 200, body: z.object({ members: z.array(Member), next: Next }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

const OfMember = InCompany.extend({ personId: PersonId })

export const removeMember = defineOperation({
  id: 'removeMember',
  summary: 'Removes a person from a company, or the person from theirs when it is their own.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/members/{personId}',
  bodyLimit: 1024,
  input: { params: OfMember },
  success: { status: 204 },
  failures: ['NOT_FOUND', 'LAST_OWNER', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const changeMemberRole = defineOperation({
  id: 'changeMemberRole',
  summary: 'Changes the role of a person of a company, read at the role it names.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/members/{personId}',
  bodyLimit: 1024,
  input: { params: OfMember, body: z.object({ role: Role, from: Role }) },
  success: { status: 200, body: z.object({ member: Member }) },
  failures: ['NOT_FOUND', 'LAST_OWNER', 'MEMBER_STALE', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const listInvitations = defineOperation({
  id: 'listInvitations',
  summary: 'Lists the pending invitations of a company, live or expired, for those who may invite.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/invitations',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: {
    status: 200,
    body: z.object({ invitations: z.array(ListedInvitation), next: Next }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createInvitation = defineOperation({
  id: 'createInvitation',
  summary: 'Invites an e-mail into a company with a role and sends the invitation.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/invitations',
  bodyLimit: 4096,
  input: {
    params: InCompany,
    body: z.object({
      email: Email,
      role: Role,
      replaces: z.object({ id: InvitationId, revision: z.number().int().nonnegative() }).optional(),
    }),
  },
  attemptKey: true,
  success: { status: 201, body: z.object({ invitation: PendingInvitation }) },
  failures: [
    'NOT_FOUND',
    'INVITATION_ROLE_REFUSED',
    'INVITATION_STALE',
    'INVITATION_CLOSED',
    'MEMBER_EXISTS',
    'OWNER_INVITATION_OPEN',
    'CLIENT_OWNER_IS_OPERATOR',
    'INVITATIONS_FULL',
    'IDEMPOTENCY_CONFLICT',
    'INVITATIONS_EXCEEDED',
    'MAIL_BOUNCED',
    'MAIL_UNAVAILABLE',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const getInvitation = defineOperation({
  id: 'getInvitation',
  summary: 'Reads the invitation admitted by its secret link and the optional session.',
  access: 'public',
  method: 'GET',
  path: '/api/invitations/{invitationId}',
  bodyLimit: 1024,
  input: { params: OfInvitation },
  success: { status: 200, body: z.object({ invitation: InvitationView }) },
  failures: ['NOT_FOUND', 'DATABASE_UNAVAILABLE'],
})

/** The revision a write was read at (code C38). */
export const Revision = z.object({ revision: z.number().int().nonnegative() })

const CompanyInvitation = InCompany.extend({ invitationId: InvitationId })

export const cancelInvitation = defineOperation({
  id: 'cancelInvitation',
  summary: 'Cancels an open invitation for a current company administrator.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/invitations/{invitationId}',
  bodyLimit: 1024,
  input: { params: CompanyInvitation, body: Revision },
  success: { status: 204 },
  failures: [
    'NOT_FOUND',
    'SESSION_REQUIRED',
    'INVITATION_STALE',
    'INVITATION_CLOSED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const renewInvitation = defineOperation({
  id: 'renewInvitation',
  summary: 'Renews a live invitation without changing its link and sends it again.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/invitations/{invitationId}',
  bodyLimit: 1024,
  input: { params: CompanyInvitation, body: Revision },
  success: { status: 200, body: z.object({ invitation: PendingInvitation }) },
  failures: [
    'NOT_FOUND',
    'SESSION_REQUIRED',
    'INVITATION_STALE',
    'INVITATION_CLOSED',
    'INVITATION_ROLE_REFUSED',
    'MEMBER_EXISTS',
    'INVITATIONS_EXCEEDED',
    'MAIL_BOUNCED',
    'MAIL_UNAVAILABLE',
    'DATABASE_UNAVAILABLE',
  ],
})

export const createInvitationPassword = defineOperation({
  id: 'createInvitationPassword',
  summary: 'Creates the invited person’s password and session without accepting the invitation.',
  access: 'entry',
  method: 'PUT',
  path: '/api/invitations/{invitationId}/password',
  bodyLimit: 4096,
  input: { params: OfInvitation, body: Revision.extend({ name: PersonName, password: Password }) },
  success: { status: 204 },
  failures: [
    'NOT_FOUND',
    'INVITATION_PASSWORD_EXISTS',
    'INVITATION_STALE',
    'INVITATION_CLOSED',
    'PASSWORD_COMPROMISED',
    'PASSWORD_CHECK_UNAVAILABLE',
    'SIGN_IN_ATTEMPTS_EXCEEDED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const declineInvitation = defineOperation({
  id: 'declineInvitation',
  summary: 'Declines an invitation by its link without requiring an account.',
  access: 'entry',
  method: 'PUT',
  path: '/api/invitations/{invitationId}/declination',
  bodyLimit: 1024,
  input: { params: OfInvitation, body: Revision },
  success: { status: 204 },
  failures: [
    'NOT_FOUND',
    'INVITATION_STALE',
    'INVITATION_CLOSED',
    'SIGN_IN_ATTEMPTS_EXCEEDED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const acceptInvitation = defineOperation({
  id: 'acceptInvitation',
  summary: 'Accepts an invitation sent to the signed-in person’s e-mail and joins the company.',
  access: 'session',
  method: 'PUT',
  path: '/api/invitations/{invitationId}/acceptance',
  bodyLimit: 1024,
  input: { params: OfInvitation, body: Revision },
  success: { status: 200, body: z.object({ company: Company }) },
  failures: [
    'NOT_FOUND',
    'INVITATION_CLOSED',
    'INVITATION_STALE',
    'COMPANY_FULL',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})
