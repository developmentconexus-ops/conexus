import type { CompanyId, PersonId } from '@conexus/hub-api'
import type { OperatorRow } from './admission.ts'
import { MemberProof, OperatorProof, OwnerInviterProof } from './admission.ts'

// Never called: `npm run typecheck` fails if a proof of admission can be made without `admit` or
// `admitOperator` (T9).
export function forgedAdmission(companyId: CompanyId, personId: PersonId, row: OperatorRow) {
  // @ts-expect-error: the constructor is private, so only admission.ts makes a proof (S7).
  const member: MemberProof = new MemberProof(companyId, personId, 'owner')
  // @ts-expect-error: an object of the same shape lacks the class's private member (S7).
  const shapedMember: MemberProof = { kind: 'MEMBER', companyId, personId, role: 'owner' }
  // @ts-expect-error: the constructor is private (S7).
  const inviter: OwnerInviterProof = new OwnerInviterProof(companyId, personId, row)
  // @ts-expect-error: an object of the same shape is not a proof (S7).
  const shapedInviter: OwnerInviterProof = {
    kind: 'OWNER_INVITER',
    companyId,
    personId,
    inviter: row,
  }
  // @ts-expect-error: the constructor is private (S7).
  const operator: OperatorProof = new OperatorProof(personId, row)
  // @ts-expect-error: an object of the same shape is not a proof (S7).
  const shapedOperator: OperatorProof = { kind: 'OPERATOR', personId, inviter: row }
  return [member, shapedMember, inviter, shapedInviter, operator, shapedOperator]
}
