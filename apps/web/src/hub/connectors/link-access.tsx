import type { CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { LinkIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { DialogBody, DialogFooter } from '../../ui/dialog.tsx'
import { Form, FormAlert } from '../../ui/form.tsx'
import { isFuture } from './lake-pick.ts'
import { CANCEL, CONTINUE, SEND_LEAD, SEND_LINK, SEND_TITLE } from './lake-text.ts'
import type { AccessForm } from './link-fields.tsx'
import { BeforePasting, Fields, NAME } from './link-fields.tsx'
import { SendPanel } from './link-send.tsx'
import { SinceField } from './since-field.tsx'

type Values = Record<string, string>

/** The box beside the keys: someone else has them, so they get a link instead of being typed here. */
function SendBox(props: { onSend: () => void }) {
  return (
    <div className="flex flex-col items-start gap-sm rounded-control border border-line p-md">
      <p className="font-medium">{SEND_TITLE}</p>
      <p className="text-text-2">{SEND_LEAD}</p>
      <Button size="sm" onClick={props.onSend}>
        <LinkIcon aria-hidden="true" />
        {SEND_LINK}
      </Button>
    </div>
  )
}

/**
 * The first step: the keys the kit declares with their help, "Desde" right after the last of them,
 * and "Enviar link" for who does not have the keys. After a refusal it is the same step with the
 * refusal above the fields and the name fixed, since the connection already exists.
 */
export function AccessStep(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  form: AccessForm
  connection: Connection | undefined
  refusal: React.ReactNode
  since: string
  onSince: (since: string) => void
  onSubmit: (values: Values) => Promise<void>
  onClose: () => void
}) {
  const { entry, form } = props
  const [sending, setSending] = useState(false)
  const busy = form.formState.isSubmitting
  if (sending) {
    const values = form.getValues()
    const filled = Object.fromEntries(Object.entries(values).filter(([field]) => field !== NAME))
    return (
      <DialogBody>
        <SendPanel
          companyId={props.companyId}
          entry={entry}
          connections={props.connections}
          name={values[NAME]}
          filled={filled}
          onBack={(name) => {
            form.setValue(NAME, name)
            setSending(false)
          }}
        />
      </DialogBody>
    )
  }
  return (
    <Form form={form} onSubmit={props.onSubmit} fill>
      <DialogBody>
        <fieldset
          disabled={busy}
          className="grid min-w-0 gap-xl md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
        >
          <div className="flex min-w-0 flex-col gap-lg">
            <BeforePasting entry={entry} />
            <SendBox onSend={() => setSending(true)} />
          </div>
          <div className="flex min-w-0 flex-col gap-lg">
            {props.refusal}
            <Fields entry={entry} reconnecting={props.connection} help={false}>
              <SinceField value={props.since} onChange={props.onSince} />
            </Fields>
          </div>
        </fieldset>
      </DialogBody>
      <DialogFooter>
        <FormAlert />
        <div className="flex flex-wrap gap-md">
          <Button type="submit" variant="primary" disabled={busy || isFuture(props.since)}>
            {CONTINUE}
          </Button>
          <Button type="button" disabled={busy} onClick={props.onClose}>
            {CANCEL}
          </Button>
        </div>
      </DialogFooter>
    </Form>
  )
}
