import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { defineOperation } from './operation.ts'
import { Role } from './roles.ts'
import { OperationId } from './tools.ts'

/** A connector's id, the kit's own form (`packages/connectors/src/kernel/definition.ts`); the server checks it against the kit. */
export const ConnectorId = z
  .string()
  .regex(/^[a-z][a-z0-9-]{1,31}$/)
  .brand('ConnectorId')
export type ConnectorId = z.infer<typeof ConnectorId>

/** What a role uses of each connector: the ids of the operations, by connector. */
export const RoleConnectors = z.record(ConnectorId, z.array(OperationId))
export type RoleConnectors = z.infer<typeof RoleConnectors>

/** `ALL` is the owner and the administrator, `EDITABLE` the developer and the member, `CUSTOM` the company's own. */
export const RoleKind = z.enum(['ALL', 'EDITABLE', 'CUSTOM'])
export type RoleKind = z.infer<typeof RoleKind>

export const ROLE_LABEL_MAX = 40

export const RoleView = z.object({
  role: Role,
  label: z.string(),
  kind: RoleKind,
  connectors: RoleConnectors,
  /** Whether the role publishes an agent whose write runs without asking (step 24.5, D1-a): the owner and the administrator always, the developer when the company's row adds it, no other role. */
  unattended: z.boolean(),
  members: z.number().int().nonnegative(),
})
export type RoleView = z.infer<typeof RoleView>

export const RoleCreate = z.object({
  label: z.string().trim().min(1).max(ROLE_LABEL_MAX),
  connectors: RoleConnectors,
})
export type RoleCreate = z.infer<typeof RoleCreate>

export const RoleChange = z.object({
  connectors: RoleConnectors,
  unattended: z.boolean().optional(),
})
export type RoleChange = z.infer<typeof RoleChange>

const InCompany = z.object({ companyId: CompanyId })
const OfRole = InCompany.extend({ role: Role })

export const listRoles = defineOperation({
  id: 'listRoles',
  summary:
    'Lists the four fixed roles and the company’s own, with what each uses of each connector.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/roles',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ roles: z.array(RoleView) }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createRole = defineOperation({
  id: 'createRole',
  summary: 'Creates a role of the company, with what it uses of each connector.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/roles',
  bodyLimit: 8192,
  input: { params: InCompany, body: RoleCreate },
  attemptKey: true,
  success: { status: 201, body: z.object({ role: RoleView }) },
  failures: [
    'NOT_FOUND',
    'REQUEST_MALFORMED',
    'ROLE_NAME_TAKEN',
    'IDEMPOTENCY_CONFLICT',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const updateRole = defineOperation({
  id: 'updateRole',
  summary:
    'Changes what a role uses of each connector; the owner and the administrator never change.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/roles/{role}',
  bodyLimit: 8192,
  input: { params: OfRole, body: RoleChange },
  success: { status: 200, body: z.object({ role: RoleView }) },
  failures: [
    'NOT_FOUND',
    'REQUEST_MALFORMED',
    'ROLE_FIXED',
    'ROLE_NOT_FOUND',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const deleteRole = defineOperation({
  id: 'deleteRole',
  summary: 'Deletes a role of the company that no person and no open invitation uses.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/roles/{role}',
  bodyLimit: 1024,
  input: { params: OfRole },
  success: { status: 204 },
  failures: [
    'NOT_FOUND',
    'ROLE_FIXED',
    'ROLE_IN_USE',
    'ROLE_NOT_FOUND',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})
