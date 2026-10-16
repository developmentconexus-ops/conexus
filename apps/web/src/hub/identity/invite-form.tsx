import type { FailureCode } from '@conexus/hub-api'
import { createInvitation, ROLE_LABELS, Role } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Controller, useFormContext } from 'react-hook-form'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure } from '../../platform/hub.ts'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Notice } from '../../ui/notice.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { companyQuery, inviteToCompany } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId')

const FIELD_OF: Partial<Record<FailureCode, 'email' | 'role'>> = {
  MEMBER_EXISTS: 'email',
  MAIL_BOUNCED: 'email',
  INVITATION_ROLE_REFUSED: 'role',
}

function RoleField({ roles }: { roles: readonly Role[] }) {
  const { control } = useFormContext()
  const shown = useFieldError('role')
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>Papel</FieldLabel>
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <Select
            id={shown.id}
            value={field.value}
            onValueChange={field.onChange}
            items={roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
          >
            <SelectTrigger {...shown.control}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

/** "Convidar pessoa": the roles on offer are the ones the Hub says this person may invite as. */
export function InviteForm() {
  const { companyId } = route.useParams()
  const { data: company } = useSuspenseQuery(companyQuery(companyId))
  const roles = company.mayInviteAs
  const send = useMutation(inviteToCompany)
  const attempt = useAttemptKey()
  // `Role.options` runs from the most to the least privileged; the form starts on the least offered.
  const form = useSchemaForm(createInvitation.input.body, {
    email: '',
    role: Role.options.findLast((role) => roles.includes(role)),
  })

  // React Hook Form clears `isSubmitSuccessful` on the next submit, a refused one included.
  const sentTo = form.formState.isSubmitSuccessful ? send.data?.invitation.email : undefined

  async function submit(values: { email: string; role: Role }) {
    try {
      await attempt((attemptKey) =>
        send.mutateAsync({ params: { companyId }, body: values, attemptKey }),
      )
      form.reset({ email: '', role: values.role }, { keepIsSubmitSuccessful: true })
    } catch (error) {
      const field = error instanceof HubFailure ? FIELD_OF[error.code] : undefined
      setServerError(form, error, field)
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <SectionTitle>Convidar pessoa</SectionTitle>
      <Form form={form} onSubmit={submit}>
        <TextField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="off"
          invalid="Escreva um e-mail."
        />
        <RoleField roles={roles} />
        <FormAlert />
        {sentTo !== undefined && <Notice>Convite enviado para {sentTo}.</Notice>}
        <SubmitButton idle="Enviar convite" pending="Enviando…" />
      </Form>
    </section>
  )
}
