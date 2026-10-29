import type { FailureCode } from '@conexus/hub-api'
import { useState } from 'react'
import type { DefaultValues, Path } from 'react-hook-form'
import { Controller, useFormContext } from 'react-hook-form'
import type { z } from 'zod'
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
import { Notice } from '../../ui/notice.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'

export type RoleOption = { value: string; label: string }

function RoleField({ options }: { options: readonly RoleOption[] }) {
  const { control } = useFormContext()
  const shown = useFieldError('role')
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>Papel</FieldLabel>
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <Select id={shown.id} value={field.value} onValueChange={field.onChange} items={options}>
            <SelectTrigger {...shown.control}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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

/**
 * The e-mail and role of an invitation, and its send: one attempt key per try (web W24), the Hub's
 * refusal on the field its code blames, "Convite enviado para …" after a send. The company's
 * invitation and an app's differ only in the schema, the roles on offer and the write.
 */
export function InviteFields<I extends { email: string; role: string | null }, O extends I>(props: {
  schema: z.ZodType<O, I>
  defaults: DefaultValues<I>
  options: readonly RoleOption[]
  fieldOf: Partial<Record<FailureCode, Path<I>>>
  send: (values: O, attemptKey: string) => Promise<{ email: string }>
  idle: string
}) {
  const attempt = useAttemptKey()
  const form = useSchemaForm(props.schema, props.defaults)
  const [sentTo, setSentTo] = useState<string>()

  async function submit(values: O) {
    try {
      const done = await attempt((attemptKey) => props.send(values, attemptKey))
      form.reset({ ...values, email: '' }, { keepIsSubmitSuccessful: true })
      setSentTo(done.email)
    } catch (error) {
      const field = error instanceof HubFailure ? props.fieldOf[error.code] : undefined
      setServerError(form, error, field)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="email"
        label="E-mail"
        type="email"
        autoComplete="off"
        invalid="Escreva um e-mail."
      />
      {props.options.length > 0 && <RoleField options={props.options} />}
      <FormAlert />
      {/* React Hook Form clears `isSubmitSuccessful` on the next submit, a refused one included. */}
      {form.formState.isSubmitSuccessful && sentTo !== undefined && (
        <Notice>Convite enviado para {sentTo}.</Notice>
      )}
      <SubmitButton idle={props.idle} pending="Enviando…" />
    </Form>
  )
}
