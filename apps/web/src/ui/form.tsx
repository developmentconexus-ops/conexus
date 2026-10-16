import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { ReactNode } from 'react'
import { useId } from 'react'
import type { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from './button.tsx'
import { Field, FieldError, FieldGroup, FieldLabel } from './field.tsx'
import { Input } from './input.tsx'

/** A form checked by the operation's own body schema from `packages/hub-api` (web W23). */
export function useSchemaForm<I extends FieldValues, O>(
  schema: z.ZodType<O, I>,
  defaultValues: DefaultValues<I>,
): UseFormReturn<I, unknown, O> {
  return useForm<I, unknown, O>({ resolver: standardSchemaResolver(schema), defaultValues })
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
 * One input with its label and its error. A schema error shows `invalid`, in the person's words;
 * a refusal the Hub put on this field with `setError` shows the Hub's sentence.
 */
export function TextField(props: {
  name: string
  label: string
  type: 'email' | 'password' | 'text'
  autoComplete: string
  invalid: string
}) {
  const { register, formState } = useFormContext()
  const id = useId()
  const error = formState.errors[props.name]
  const sentence = error?.type === 'server' ? error.message : undefined
  const message = error ? (typeof sentence === 'string' ? sentence : props.invalid) : undefined
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
      <Input
        id={id}
        type={props.type}
        autoComplete={props.autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(props.name)}
      />
      <FieldError id={`${id}-error`}>{message}</FieldError>
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

export function SubmitButton(props: { idle: string; pending: string }) {
  const { formState } = useFormContext()
  return (
    <Button type="submit" variant="primary" disabled={formState.isSubmitting}>
      {formState.isSubmitting ? props.pending : props.idle}
    </Button>
  )
}
