import type { CompanyId, FailureCode, ProjectId } from '@conexus/hub-api'
import { REQUEST_MESSAGE_MAX, requestPublish } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { SendIcon } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  setWriteError,
  useFieldError,
  useSchemaForm,
} from '../../ui/form.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { sendPublishRequest } from './queries.ts'
import { UNCONFIRMED_ASK } from './text.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** The refusals the Projeto read again explains by itself: a request is open, or the version is on the air. */
const EXPLAINED_BY_READING: ReadonlySet<FailureCode> = new Set([
  'PUBLISH_REQUEST_ALREADY_OPEN',
  'PUBLISH_REQUEST_ALREADY_LIVE',
])
/** The refusals that leave a sentence below the top of the Projeto, as a refused publication does. */
const SAID_BELOW: ReadonlySet<FailureCode> = new Set([
  'APP_VERSION_NOT_FOUND',
  'PUBLISH_REQUEST_NOT_NEEDED',
])

/** The optional sentence of a box that asks for one, a message or a reason; the box shows its refusal. */
export function MessageField(props: { name: 'message' | 'reason'; label: string }) {
  const { register } = useFormContext()
  const shown = useFieldError(props.name, `Escreva até ${REQUEST_MESSAGE_MAX} caracteres.`)
  return (
    <Field {...shown.field}>
      <FieldLabel htmlFor={shown.id}>{props.label}</FieldLabel>
      <Textarea
        id={shown.id}
        maxLength={REQUEST_MESSAGE_MAX}
        {...shown.control}
        {...register(props.name)}
      />
      <FieldError id={shown.errorId}>{shown.message}</FieldError>
    </Field>
  )
}

function AskForm(
  props: Scope & { number: number; onClose: () => void; onChanged: (message?: string) => void },
) {
  const { companyId, projectId, number } = props
  const router = useRouter()
  const send = useMutation(sendPublishRequest)
  const attempt = useAttemptKey()
  const form = useSchemaForm(requestPublish.input.body.pick({ message: true }), { message: '' })

  async function submit({ message }: { message: string }) {
    try {
      await attempt((attemptKey) =>
        send.mutateAsync({
          params: { companyId, projectId },
          body: { number, message: message.trim() },
          attemptKey,
        }),
      )
      props.onClose()
    } catch (error) {
      if (!(error instanceof HubFailure)) return setServerError(form, error)
      if (EXPLAINED_BY_READING.has(error.code)) props.onClose()
      else if (SAID_BELOW.has(error.code)) {
        props.onClose()
        props.onChanged(sentenceOf(error))
      } else if (error.code === 'NOT_FOUND') {
        props.onClose()
        await router.invalidate()
      } else setWriteError(form, error, UNCONFIRMED_ASK)
    }
  }

  const failed = form.formState.errors.root?.server !== undefined
  return (
    <Form form={form} onSubmit={submit}>
      <MessageField name="message" label="Mensagem (opcional)" />
      <FormAlert />
      <div className="flex flex-wrap justify-end gap-sm">
        <Button type="button" disabled={form.formState.isSubmitting} onClick={props.onClose}>
          Cancelar
        </Button>
        <SubmitButton idle={failed ? 'Tentar de novo' : 'Pedir'} pending="Enviando…" />
      </div>
    </Form>
  )
}

/**
 * **Pedir para publicar**, where **Publicar** is for who does not publish: a box asking an optional
 * message, then the Hub opens the request and the Projeto read again shows its line. The attempt key
 * is the box's, one per opening (web W24). The refusals the Projeto explains by itself leave through
 * `onChanged`, as **Publicar**'s leave through its own, and opening the box clears the sentence the last
 * action left.
 */
export function RequestPublish(
  props: Scope & {
    number: number
    label: 'Pedir para publicar' | 'Pedir esta'
    onChanged: (message?: string) => void
  },
) {
  const { label, number } = props
  const [open, setOpen] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) props.onChanged()
        setOpen(next)
      }}
    >
      <DialogTrigger
        render={
          label === 'Pedir para publicar' ? (
            <Button variant="primary" phoneIcon aria-label={label} />
          ) : (
            <Button />
          )
        }
      >
        {label === 'Pedir para publicar' ? (
          <>
            <SendIcon className="md:hidden" aria-hidden="true" />
            <span className="max-md:hidden">{label}</span>
          </>
        ) : (
          label
        )}
      </DialogTrigger>
      <DialogContent
        title={`Pedir para publicar a versão ${number}`}
        description="Um dono ou um administrador decide."
      >
        <AskForm {...props} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
