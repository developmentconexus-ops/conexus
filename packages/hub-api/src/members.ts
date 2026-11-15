import { z } from 'zod'
import { Email, PersonId } from './identity.ts'
import { Role } from './roles.ts'

/**
 * A person of a company, with the job title and department they wrote, `null` while unwritten.
 * `mayRemove`, `mayChangeTo` and `mayEditProfile` are what the viewer may do to this row, the Hub's
 * one answer (code C26); `invitationsSent` counts the invitations a removal would cancel.
 */
export const Member = z.object({
  personId: PersonId,
  name: z.string().min(1),
  email: Email,
  role: Role,
  mayRemove: z.boolean(),
  mayChangeTo: z.array(Role),
  jobTitle: z.string().nullable(),
  department: z.string().nullable(),
  mayEditProfile: z.boolean(),
  invitationsSent: z.number().int().nonnegative(),
})
export type Member = z.infer<typeof Member>
