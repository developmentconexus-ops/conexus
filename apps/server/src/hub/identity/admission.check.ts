import type { CompanyId, PersonId } from '@conexus/hub-api'
import { MemberProof, OperatorProof, OwnerInviterProof } from './admission.ts'

// Never called: `npm run typecheck` fails if a proof of admission can be made without `admit` or
// `admitOperator` (T9).
export function forgedAdmission(companyId: CompanyId, personId: PersonId) {
  // @ts-expect-error: the constructor is private, so only admission.ts makes a proof (S7).
  const member: MemberProof = new MemberProof(companyId, personId, 'owner')
  // @ts-expect-error: an object of the same shape lacks the class's private member (S7).
  const shapedMember: MemberProof = { kind: 'MEMBER', companyId, personId, role: 'owner' }
  // @ts-expect-error: the constructor is private (S7).
  const inviter: OwnerInviterProof = new OwnerInviterProof(companyId, personId)
  // @ts-expect-error: an object of the same shape is not a proof (S7).
  const shapedInviter: OwnerInviterProof = { kind: 'OWNER_INVITER', companyId, personId }
  // @ts-expect-error: the constructor is private (S7).
  const operator: OperatorProof = new OperatorProof(personId)
  // @ts-expect-error: an object of the same shape is not a proof (S7).
  const shapedOperator: OperatorProof = { kind: 'OPERATOR', personId }
  return [member, shapedMember, inviter, shapedInviter, operator, shapedOperator]
}
