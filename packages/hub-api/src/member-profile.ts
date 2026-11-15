import { z } from 'zod'
import { OfMember } from './companies.ts'
import { Member } from './members.ts'
import { defineOperation } from './operation.ts'

/** The longest job title or department, in characters: the same the table's check holds. */
export const MEMBER_PROFILE_MAX = 80

/** What a person writes of their work, or `null` for nothing: a blank is not a text. */
const ProfileText = z.string().trim().min(1).max(MEMBER_PROFILE_MAX).nullable()

export const setMemberProfile = defineOperation({
  id: 'setMemberProfile',
  summary:
    'Replaces the job title and the department of a member of a company, as the person wrote them or an administrator for another.',
  access: 'session',
  method: 'PUT',
  path: '/api/companies/{companyId}/members/{personId}/profile',
  bodyLimit: 1024,
  input: {
    params: OfMember,
    body: z.object({ jobTitle: ProfileText, department: ProfileText }),
  },
  success: { status: 200, body: z.object({ member: Member }) },
  failures: ['NOT_FOUND', 'NOT_IN_ROLE', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})
