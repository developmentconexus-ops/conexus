import type { CompanyId, PersonId } from '@conexus/hub-api'
import { Admitted } from './admission.ts'

// Never called: `npm run typecheck` fails if a proof of admission can be made without `admit` (T9).
export function forgedAdmission(companyId: CompanyId, personId: PersonId): Admitted[] {
  // @ts-expect-error: the constructor is private, so only admission.ts makes a proof (S7).
  const made: Admitted = new Admitted(companyId, personId, 'owner')
  // @ts-expect-error: an object of the same shape lacks the class's private member (S7).
  const shaped: Admitted = { companyId, personId, role: 'owner' }
  return [made, shaped]
}
