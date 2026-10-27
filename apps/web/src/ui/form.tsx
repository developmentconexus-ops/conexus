import type { FailureCode } from '@conexus/hub-api'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { ReactNode } from 'react'
import { useId } from 'react'
import type { DefaultValues, FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import type { z } from 'zod'
import { keepsAttemptKey } from '../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../platform/hub.ts'
import { Button } from './button.tsx'
import { Field, FieldError, FieldGroup, FieldLabel } from './field.tsx'
import { Input } from './input.tsx'

/** A form checked by the operation's own body schema from `packages/hub-api` (web W23). */
export function useSchemaForm<I extends FieldValues, O>(
  schema: z.ZodType<O, I>,
  defaultValues: DefaultValues<I>,
  mode: 'onSubmit' | 'onBlur' = 'onSubmit',
): UseFormReturn<I, unknown, O> {
  return useForm<I, unknown, O>({
    resolver: standardSchemaResolver(schema),
    defaultValues,
    mode,
    reValidateMode: mode === 'onBlur' ? 'onBlur' : 'onChange',
  })
}

export function Form<I extends FieldValues, O>(props: {
  form: UseFormReturn<I, unknown, O>
  onSubmit: (values: O) => Promise<void>
  children: ReactNode
}) {
  return (
    <FormProvider {...props.form}>
      <form noValidate onSubmit={props.form.handleSubmit(props.onSubmit)} className="w-full">
        <FieldGroup>{props.children}</FieldGroup>
      </form>
    </FormProvider>
  )
}

/**
 * What a field shows for its error: its message, and the attributes that tie it to the control. A
 * refusal the Hub put on the field with `setError` shows the Hub's sentence; a schema error shows
 * `invalid` when given, in the person's words, and the schema's message otherwise.
 */
export function useFieldError(name: string, invalid?: string) {
  const { formState } = useFormContext()
  const id = useId()
  const error = formState.errors[name]
  const sentence = typeof error?.message === 'string' ? error.message : undefined
  const message = error?.type === 'server' ? sentence : (invalid ?? sentence)
  const errorId = `${id}-error`
  return {
    id,
    errorId,
    message: error ? message : undefined,
    field: { 'data-invalid': error ? true : undefined },
    control: {
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : undefined,
    },
  }
}

export function TextField(props: {
  name: string
  label: string
  type: 'email' | 'password' | 'text'
  autoComplete: string
  invalid: string
}) {
  const { register } = useFormContext()
  const shown = useFieldError(props.name, props.invalid)
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>{props.label}</FieldLabel>
      <Input
        id={shown.id}
        type={props.type}
        autoComplete={props.autoComplete}
        {...shown.control}
        {...register(props.name)}
      />
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

/** The refusal that belongs to the whole form, such as a sign-in refusal (web W23). */
export function FormAlert() {
  const { formState } = useFormContext()
  const message = formState.errors.root?.server?.message
  if (!message) return null
  return (
    <p role="alert" className="text-danger">
      {message}
    </p>
  )
}

/** Puts the sentence for a failure on a field, or on the whole form when no field is named. */
export function setServerError<I extends FieldValues, O>(
  form: UseFormReturn<I, unknown, O>,
  error: unknown,
  field?: Path<I>,
) {
  form.setError(field ?? 'root.server', { type: 'server', message: sentenceOf(error) })
}

/**
 * A create's failure on its form: on the field `fieldOf` blames for its code (web W23), `unconfirmed`
 * when the Hub may have acted and the key stays (web W24), its sentence otherwise.
 */
export function setWriteError<I extends FieldValues, O>(
  form: UseFormReturn<I, unknown, O>,
  error: unknown,
  unconfirmed: string,
  fieldOf: Partial<Record<FailureCode, Path<I>>> = {},
) {
  const field = error instanceof HubFailure ? fieldOf[error.code] : undefined
  if (keepsAttemptKey(error) && field === undefined) {
    form.setError('root.server', { type: 'server', message: unconfirmed })
  } else setServerError(form, error, field)
}

export function SubmitButton(props: { idle: string; pending: string; label?: string }) {
  const { formState } = useFormContext()
  return (
    <Button
      type="submit"
      variant="primary"
      aria-label={props.label}
      disabled={formState.isSubmitting}
    >
      {formState.isSubmitting ? props.pending : props.idle}
    </Button>
  )
}
