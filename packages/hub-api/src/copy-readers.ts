import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { OfRole } from './company-roles.ts'
import { CopyId, READ_FAILURES } from './copies.ts'
import { defineOperation } from './operation.ts'
import { Role } from './roles.ts'

const InCompany = z.object({ companyId: CompanyId })

/** Who reads a copy: the owner and the administrator first, then each role marked for it, with how many people hold each. */
export const CopyReaders = z.object({
  copyId: CopyId,
  roles: z.array(z.object({ role: Role, label: z.string(), members: z.int().min(0) })),
})
export type CopyReaders = z.infer<typeof CopyReaders>

export const listCopyReaders = defineOperation({
  id: 'listCopyReaders',
  summary:
    'Lists, for each copy the person reads, the roles that read it and how many people hold each; no person is named.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/copy-readers',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: z.object({ readers: z.array(CopyReaders) }) },
  failures: READ_FAILURES,
})

/** The most copies one request marks for a role. */
export const ROLE_COPIES_MAX = 200

export const setRoleCopies = defineOperation({
  id: 'setRoleCopies',
  summary:
    'Sets the copies a role reads in the company’s database; the owner and the administrator read every copy and are not marked.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/roles/{role}/copies',
  bodyLimit: 16384,
  input: { params: OfRole, body: z.object({ copies: z.array(CopyId).max(ROLE_COPIES_MAX) }) },
  success: { status: 200, body: z.object({ copies: z.array(CopyId) }) },
  failures: [
    ...READ_FAILURES,
    'ROLE_FIXED',
    'ROLE_NOT_FOUND',
    'COPY_NOT_FOUND',
    'COPY_DATABASE_UNAVAILABLE',
  ],
})
