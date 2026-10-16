import type { FailureCode } from '@conexus/hub-api'
import { createInvitation, Role } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  TextField,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { companyQuery, inviteToCompany } from './queries.ts'
import { ROLE_LABELS } from './roles.ts'

const route = getRouteApi('/_app/companies/$companyId')

// A refusal that names a field is shown on it; any other is the form's.
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
  const [sentTo, setSentTo] = useState<string | undefined>(undefined)
  // `Role.options` runs from the most to the least privileged; the form starts on the least offered.
  const form = useSchemaForm(createInvitation.input.body, {
    email: '',
    role: Role.options.findLast((role) => roles.includes(role)),
  })

  async function submit(values: { email: string; role: Role }) {
    setSentTo(undefined)
    try {
      const { invitation } = await attempt((attemptKey) =>
        send.mutateAsync({ params: { companyId }, body: values, attemptKey }),
      )
      setSentTo(invitation.email)
      form.reset({ email: '', role: values.role })
    } catch (error) {
      const field = error instanceof HubFailure ? FIELD_OF[error.code] : undefined
      form.setError(field ?? 'root.server', { type: 'server', message: sentenceOf(error) })
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <h2 className="font-display text-title">Convidar pessoa</h2>
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
        {sentTo !== undefined && (
          <p role="status" className="text-text">
            Convite enviado para {sentTo}.
          </p>
        )}
        <SubmitButton idle="Enviar convite" pending="Enviando…" />
      </Form>
    </section>
  )
}
