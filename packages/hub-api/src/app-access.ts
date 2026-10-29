import { RoleName } from '@conexus/app-contract'
import { z } from 'zod'
import { AppEntry } from './address.ts'
import { CompanyId, InvitationId, Next, Page } from './companies.ts'
import { Email, PersonId } from './identity.ts'
import { defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/**
 * A person from outside the company who uses the app, with the role given; `roleDeclared` is false
 * when the published version does not declare it, or declares roles and the row has none.
 */
export const AppAccessRow = z.object({
  personId: PersonId,
  name: z.string().min(1),
  email: Email,
  role: RoleName.nullable(),
  roleDeclared: z.boolean(),
  grantedAt: z.iso.datetime(),
})
export type AppAccessRow = z.infer<typeof AppAccessRow>

/** An app's open invitation: the address and the role it gives, `null` in an app without roles. */
export const AppAccessInvitation = z.object({
  id: InvitationId,
  email: Email,
  role: RoleName.nullable(),
  expiresAt: z.iso.datetime(),
})
export type AppAccessInvitation = z.infer<typeof AppAccessInvitation>

const AppRole = z.object({ name: RoleName, label: z.string() })

/**
 * Who uses a Projeto's app: the members, who build it and hold every role (E1), the people given it
 * and the open invitations. `roles` are the published version's, none before the first Publicar;
 * `mayManage` is what the viewer's role allows, the Hub's one answer (code C26).
 */
export const AppAccessList = z.object({
  roles: z.array(AppRole),
  published: z.boolean(),
  members: z.array(z.object({ personId: PersonId, name: z.string(), email: Email })),
  people: z.array(AppAccessRow),
  invitations: z.array(AppAccessInvitation),
  mayManage: z.boolean(),
})
export type AppAccessList = z.infer<typeof AppAccessList>

/** A person from outside the company, with each of its apps they use. */
export const CompanyAppPerson = z.object({
  personId: PersonId,
  name: z.string().min(1),
  email: Email,
  apps: z.array(
    z.object({
      projectId: ProjectId,
      projectName: z.string().min(1),
      role: RoleName.nullable(),
      // Null with a role: the published version no longer declares it.
      roleLabel: z.string().nullable(),
    }),
  ),
})
export type CompanyAppPerson = z.infer<typeof CompanyAppPerson>

const InCompany = z.object({ companyId: CompanyId })
const OfProject = InCompany.extend({ projectId: ProjectId })
const OfPerson = OfProject.extend({ personId: PersonId })

export const listAppAccess = defineOperation({
  id: 'listAppAccess',
  summary: 'Lists who uses a Projeto’s app, for any member, and whether the viewer may change it.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}/access',
  bodyLimit: 1024,
  input: { params: OfProject },
  success: { status: 200, body: AppAccessList },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const inviteToApp = defineOperation({
  id: 'inviteToApp',
  summary:
    'Invites an e-mail from outside the company to use a Projeto’s app with a role, and sends the invitation.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/projects/{projectId}/access/invitations',
  bodyLimit: 4096,
  input: { params: OfProject, body: z.object({ email: Email, role: RoleName.nullable() }) },
  attemptKey: true,
  success: { status: 201, body: z.object({ invitation: AppAccessInvitation }) },
  failures: [
    'NOT_FOUND',
    'APP_NOT_PUBLISHED',
    'APP_ACCESS_MEMBER',
    'APP_ACCESS_EXISTS',
    'APP_ROLE_UNKNOWN',
    'INVITATION_CLOSED',
    'INVITATIONS_FULL',
    'IDEMPOTENCY_CONFLICT',
    'INVITATIONS_EXCEEDED',
    'MAIL_BOUNCED',
    'MAIL_UNAVAILABLE',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const changeAppAccess = defineOperation({
  id: 'changeAppAccess',
  summary: 'Changes the role a person from outside the company holds in a Projeto’s app.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/projects/{projectId}/access/{personId}',
  bodyLimit: 1024,
  input: { params: OfPerson, body: z.object({ role: RoleName }) },
  success: { status: 200, body: z.object({ person: AppAccessRow }) },
  failures: ['NOT_FOUND', 'APP_ROLE_UNKNOWN', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const revokeAppAccess = defineOperation({
  id: 'revokeAppAccess',
  summary:
    'Takes a person’s access to a Projeto’s app, with their open invitation to it and their sessions in it.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/projects/{projectId}/access/{personId}',
  bodyLimit: 1024,
  input: { params: OfPerson },
  success: { status: 204 },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const cancelAppInvitation = defineOperation({
  id: 'cancelAppInvitation',
  summary: 'Cancels an open invitation to a Projeto’s app.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/projects/{projectId}/access/invitations/{invitationId}',
  bodyLimit: 1024,
  input: { params: OfProject.extend({ invitationId: InvitationId }) },
  success: { status: 204 },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const listCompanyAppAccess = defineOperation({
  id: 'listCompanyAppAccess',
  summary: 'Lists the people from outside the company who use its apps, for any member.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/app-access',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: {
    status: 200,
    body: z.object({ people: z.array(CompanyAppPerson), next: Next, mayManage: z.boolean() }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const revokeAllAppAccess = defineOperation({
  id: 'revokeAllAppAccess',
  summary:
    'Takes a person’s access to every app of the company, with their open invitations and sessions.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/app-access/{personId}',
  bodyLimit: 1024,
  input: { params: InCompany.extend({ personId: PersonId }) },
  success: { status: 204 },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const listMyApps = defineOperation({
  id: 'listMyApps',
  summary: 'Lists the apps the person uses without being a member of their company.',
  access: 'session',
  method: 'GET',
  path: '/api/apps',
  bodyLimit: 1024,
  input: {},
  success: { status: 200, body: z.object({ apps: z.array(AppEntry) }) },
  failures: ['SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})
