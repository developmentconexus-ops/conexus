import type { CompanyId, ConnectorEntry } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent, DialogTrigger } from '../../ui/dialog.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { sendLink } from './queries.ts'
import { listChanged } from './text.ts'

const UNCONFIRMED = 'Não confirmamos a ligação. Tente de novo.'

/** The connector's fields as the catalog names them: each pasted whole, within its length. */
function credentialOf(entry: ConnectorEntry) {
  return z.object(
    Object.fromEntries(
      entry.fields.map((field) => [field.name, z.string().min(1).max(field.maxLength)]),
    ),
  )
}

/**
 * The form builds itself from the catalog's fields, each a password field. The Hub seals what is
 * pasted and answers with the connection, never the fields, and they are cleared once it is linked.
 * The attempt key stays until the Hub settles the outcome (web W24); keys it refused stay in their
 * fields, for the person to correct.
 */
function LinkForm(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  onLinked: (notice?: string) => void
  onCancel: () => void
}) {
  const { companyId, entry } = props
  const send = useMutation(sendLink)
  const attempt = useAttemptKey()
  const form = useSchemaForm(
    credentialOf(entry),
    Object.fromEntries(entry.fields.map((field) => [field.name, ''])),
  )

  async function submit(credential: Record<string, string>) {
    try {
      await attempt((attemptKey) =>
        send.mutateAsync({
          params: { companyId },
          body: { connector: entry.id, credential },
          attemptKey,
        }),
      )
      form.reset()
      props.onLinked()
    } catch (error) {
      if (listChanged(error)) props.onLinked(sentenceOf(error))
      else setWriteError(form, error, UNCONFIRMED)
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <fieldset disabled={form.formState.isSubmitting} className="contents">
        {entry.fields.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            type="password"
            autoComplete="off"
            invalid={`Cole ${field.label}.`}
          />
        ))}
      </fieldset>
      <FormAlert />
      <div className="flex flex-wrap gap-md">
        <SubmitButton idle="Ligar" pending="Ligando…" />
        <Button type="button" disabled={form.formState.isSubmitting} onClick={props.onCancel}>
          Cancelar
        </Button>
      </div>
    </Form>
  )
}

/**
 * "Ligar" and the dialog it opens. The connector leaves "Para ligar" once linked, so the page is told
 * (`onLinked`) to put focus on the list it joined and not on the button it leaves.
 */
export function LinkDialog(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  onLinked: (notice?: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" size="sm" />}>Ligar</DialogTrigger>
      <DialogContent
        title={`Ligar ${props.entry.name}`}
        description="As chaves ficam guardadas no Hub e não aparecem de novo."
      >
        <LinkForm
          companyId={props.companyId}
          entry={props.entry}
          onLinked={(notice) => {
            setOpen(false)
            props.onLinked(notice)
          }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
