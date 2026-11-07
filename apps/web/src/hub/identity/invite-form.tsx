import type { CompanyId, FailureCode, Role } from '@conexus/hub-api'
import { createInvitation, FIXED_ROLES, roleLabel } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { SectionTitle } from '../../ui/list.tsx'
import { InviteFields } from './invite-fields.tsx'
import { inviteToCompany } from './queries.ts'

const FIELD_OF: Partial<Record<FailureCode, 'email' | 'role'>> = {
  MEMBER_EXISTS: 'email',
  MAIL_BOUNCED: 'email',
  INVITATION_ROLE_REFUSED: 'role',
}

/** "Convidar pessoa": the roles on offer are the ones the Hub says this person may invite as. */
export function InviteForm({ companyId, roles }: { companyId: CompanyId; roles: readonly Role[] }) {
  const send = useMutation(inviteToCompany)
  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <SectionTitle>Convidar pessoa</SectionTitle>
      <InviteFields
        schema={createInvitation.input.body}
        // `FIXED_ROLES` runs from the most to the least privileged; the form starts on the least offered.
        defaults={{
          email: '',
          role: FIXED_ROLES.findLast((fixed) => roles.some((offered) => offered === fixed)),
        }}
        options={roles.map((role) => ({ value: role, label: roleLabel(role) }))}
        fieldOf={FIELD_OF}
        send={async (values, attemptKey) =>
          (await send.mutateAsync({ params: { companyId }, body: values, attemptKey })).invitation
        }
        idle="Enviar convite"
      />
    </section>
  )
}
