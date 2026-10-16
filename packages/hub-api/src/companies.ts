import { z } from 'zod'
import { Email, PersonId } from './identity.ts'
import type { Operation } from './operation.ts'

const LIBRARY_ID = /^[A-Za-z0-9]{32}$/

export const CompanyId = z.string().regex(LIBRARY_ID).brand('CompanyId')
export type CompanyId = z.infer<typeof CompanyId>

export const InvitationId = z.string().regex(LIBRARY_ID).brand('InvitationId')
export type InvitationId = z.infer<typeof InvitationId>

export const Role = z.enum(['owner', 'admin', 'member'])
export type Role = z.infer<typeof Role>

export const Company = z.object({ id: CompanyId, name: z.string().min(1) })
export type Company = z.infer<typeof Company>

export const Membership = z.object({ company: Company, role: Role })
export type Membership = z.infer<typeof Membership>

export const Member = z.object({
  personId: PersonId,
  name: z.string().min(1),
  email: Email,
  role: Role,
})
export type Member = z.infer<typeof Member>

export const PendingInvitation = z.object({
  id: InvitationId,
  email: Email,
  role: Role,
  expiresAt: z.iso.datetime(),
})
export type PendingInvitation = z.infer<typeof PendingInvitation>

export const ReceivedInvitation = z.object({
  id: InvitationId,
  company: Company,
  role: Role,
  inviterName: z.string().min(1),
  state: z.enum(['PENDING', 'EXPIRED', 'ACCEPTED', 'CANCELED']),
})
export type ReceivedInvitation = z.infer<typeof ReceivedInvitation>

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

const CompanyName = z.string().trim().min(1).max(100)
const PersonName = z.string().trim().min(1).max(100)
const Page = z.object({ page: PageToken.optional() })
const InCompany = z.object({ companyId: CompanyId })
const OfInvitation = z.object({ invitationId: InvitationId })

export const listCompanies = {
  id: 'listCompanies',
  summary: 'Lists the companies the person belongs to, with the role in each.',
  access: 'session',
  method: 'GET',
  path: '/api/companies',
  bodyLimit: 1024,
  input: { query: Page },
  success: {
    status: 200,
    body: z.object({ companies: z.array(Membership), mayCreate: z.boolean(), next: Next }),
  },
  failures: ['SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const createCompany = {
  id: 'createCompany',
  summary: 'Creates a company with the installation administrator as its first owner.',
  access: 'session',
  method: 'POST',
  path: '/api/companies',
  bodyLimit: 4096,
  input: { body: z.object({ name: CompanyName }) },
  attemptKey: true,
  success: { status: 201, body: z.object({ company: Company }) },
  failures: ['NOT_FOUND', 'IDEMPOTENCY_CONFLICT', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const getCompany = {
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
} as const satisfies Operation

export const listMembers = {
  id: 'listMembers',
  summary: 'Lists the people of a company the person belongs to.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/members',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: { status: 200, body: z.object({ members: z.array(Member), next: Next }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const listInvitations = {
  id: 'listInvitations',
  summary: 'Lists the open invitations of a company, for the people who may invite.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/invitations',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: {
    status: 200,
    body: z.object({ invitations: z.array(PendingInvitation), next: Next }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const createInvitation = {
  id: 'createInvitation',
  summary: 'Invites an e-mail into a company with a role and sends the invitation.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/invitations',
  bodyLimit: 4096,
  input: { params: InCompany, body: z.object({ email: Email, role: Role }) },
  attemptKey: true,
  success: { status: 201, body: z.object({ invitation: PendingInvitation }) },
  failures: [
    'NOT_FOUND',
    'INVITATION_ROLE_REFUSED',
    'MEMBER_EXISTS',
    'INVITATIONS_FULL',
    'IDEMPOTENCY_CONFLICT',
    'INVITATIONS_EXCEEDED',
    'MAIL_BOUNCED',
    'MAIL_UNAVAILABLE',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
} as const satisfies Operation

export const getInvitation = {
  id: 'getInvitation',
  summary: 'Reads an invitation sent to the signed-in person’s e-mail.',
  access: 'session',
  method: 'GET',
  path: '/api/invitations/{invitationId}',
  bodyLimit: 1024,
  input: { params: OfInvitation },
  success: { status: 200, body: z.object({ invitation: ReceivedInvitation }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
} as const satisfies Operation

export const putPasswordLink = {
  id: 'putPasswordLink',
  summary: 'Sends the invited e-mail a link to create its password, creating the person if new.',
  access: 'entry',
  method: 'PUT',
  path: '/api/invitations/{invitationId}/password-link',
  bodyLimit: 4096,
  input: { params: OfInvitation, body: z.object({ name: PersonName }) },
  success: { status: 204 },
  failures: [
    'NOT_FOUND',
    'PASSWORD_LINKS_EXCEEDED',
    'MAIL_BOUNCED',
    'MAIL_UNAVAILABLE',
    'DATABASE_UNAVAILABLE',
  ],
} as const satisfies Operation

export const acceptInvitation = {
  id: 'acceptInvitation',
  summary: 'Accepts an invitation sent to the signed-in person’s e-mail and joins the company.',
  access: 'session',
  method: 'PUT',
  path: '/api/invitations/{invitationId}/acceptance',
  bodyLimit: 1024,
  input: { params: OfInvitation },
  success: { status: 200, body: z.object({ company: Company }) },
  failures: [
    'NOT_FOUND',
    'INVITATION_CLOSED',
    'COMPANY_FULL',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
} as const satisfies Operation
