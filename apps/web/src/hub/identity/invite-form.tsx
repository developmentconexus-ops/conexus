import type { CompanyId, FailureCode } from '@conexus/hub-api'
import { createInvitation, ROLE_LABELS, Role } from '@conexus/hub-api'
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
        // `Role.options` runs from the most to the least privileged; the form starts on the least offered.
        defaults={{ email: '', role: Role.options.findLast((role) => roles.includes(role)) }}
        options={roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
        fieldOf={FIELD_OF}
        send={async (values, attemptKey) =>
          (await send.mutateAsync({ params: { companyId }, body: values, attemptKey })).invitation
        }
        idle="Enviar convite"
      />
    </section>
  )
}
