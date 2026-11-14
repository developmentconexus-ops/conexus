import type { CompanyId } from '@conexus/hub-api'
import { Demand, Target } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { sendSuggestion } from './queries.ts'
import { UNCONFIRMED_SUGGESTION } from './text.ts'

const Suggested = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500),
  why: Demand,
})
type Suggested = z.infer<typeof Suggested>

function Explanation() {
  const { register } = useFormContext()
  const shown = useFieldError('description')
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>Explicação</FieldLabel>
      <Textarea id={shown.id} {...shown.control} {...register('description')} />
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

/**
 * **Sugerir mudança** (A Ontologia da empresa, U4): the person's own label and explanation for one
 * element, and why. It becomes an open proposal that whoever approves decides; one request per
 * attempt (web W24).
 */
export function SuggestForm(props: {
  companyId: CompanyId
  target: string
  title: string
  current: { name: string; description: string }
  onClose: () => void
}) {
  const { companyId, target } = props
  const attempt = useAttemptKey()
  const send = useMutation(sendSuggestion)
  const form = useSchemaForm(Suggested, { ...props.current, why: '' })
  const address = Target.safeParse(target)
  const proposed = address.success ? address.data : undefined

  async function submit(values: Suggested) {
    if (proposed === undefined) return
    try {
      await attempt((attemptKey) =>
        send.mutateAsync({
          params: { companyId },
          attemptKey,
          body: {
            why: values.why,
            items: [
              {
                kind: 'RENAME_LABEL',
                target: proposed,
                name: values.name,
                ...(values.description === '' ? {} : { description: values.description }),
              },
            ],
          },
        }),
      )
      props.onClose()
    } catch (error) {
      if (error instanceof HubFailure || error instanceof Error)
        setWriteError(form, error, UNCONFIRMED_SUGGESTION)
    }
  }

  if (proposed === undefined) return null
  return (
    <section
      aria-label={props.title}
      className="flex flex-col gap-md rounded-card border border-line bg-surface p-md"
    >
      <h3 className="font-display text-title">{props.title}</h3>
      <Form form={form} onSubmit={submit}>
        <TextField name="name" label="Quer dizer" type="text" autoComplete="off" maxLength={80} />
        <Explanation />
        <TextField name="why" label="Por quê" type="text" autoComplete="off" maxLength={500} />
        <FormAlert />
        <div className="flex flex-wrap gap-sm">
          <Button type="button" onClick={props.onClose}>
            Cancelar
          </Button>
          <SubmitButton idle="Propor a mudança" pending="Propondo…" />
        </div>
      </Form>
    </section>
  )
}
