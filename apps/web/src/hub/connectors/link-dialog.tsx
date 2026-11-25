import type { CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { HubFailure, sentenceOf, unconfirmedText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Dialog, DialogBody, DialogContent, DialogFooter } from '../../ui/dialog.tsx'
import { Form, FormAlert, SubmitButton, setWriteError, useSchemaForm } from '../../ui/form.tsx'
import { Fields, NAME, schemaOf, suggestedName } from './link-fields.tsx'
import { connectionKeys, connectionsPrefix, sendReconnect, sendSignInStart } from './queries.ts'
import { continueText, RECONNECT, signInWindowText } from './text.ts'

const UNCONFIRMED = unconfirmedText('a ligação', 'Tente de novo.')
const LIST_CHANGED: ReadonlySet<string> = new Set(['CONNECTION_NAME_TAKEN', 'CONNECTOR_UNKNOWN'])

function Buttons(props: { entry: ConnectorEntry; leaving: boolean; onClose: () => void }) {
  const { entry, leaving } = props
  const { formState } = useFormContext()
  const busy = formState.isSubmitting || leaving
  return (
    <div className="flex flex-wrap gap-md">
      {entry.auth === 'oauth2_code' ? (
        <Button type="submit" variant="primary" disabled={busy}>
          {continueText(entry.name)}
        </Button>
      ) : (
        <SubmitButton idle={RECONNECT} pending="Ligando…" />
      )}
      <Button type="button" disabled={busy} onClick={props.onClose}>
        Cancelar
      </Button>
    </div>
  )
}

/**
 * The form of a trip to the provider (the name, then the provider's own page) and of "Conectar de
 * novo" with pasted keys: the fields build themselves from the catalog, the Client ID to the eye
 * and the others hidden. A first link by pasted keys is the window of `link-window.tsx`. What the
 * Hub refused stays in its fields.
 */
function LinkForm(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  reconnecting: Connection | undefined
  onClose: () => void
}) {
  const { companyId, entry, reconnecting } = props
  const resend = useMutation(sendReconnect)
  const go = useSignInStart(companyId)
  const oauth = entry.auth === 'oauth2_code'
  const [leaving, setLeaving] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useSchemaForm(schemaOf(entry), {
    [NAME]: reconnecting?.name ?? suggestedName(entry, props.connections),
    ...Object.fromEntries(entry.fields.map((field) => [field.name, ''])),
  })

  async function reconnect(target: Connection, credential: Record<string, string>) {
    await resend.mutateAsync({
      params: { companyId, connectionId: target.id },
      body: { credential },
    })
    form.reset()
    props.onClose()
    for (const queryKey of connectionKeys(companyId, target.id)) {
      void queryClient.invalidateQueries({ queryKey })
    }
    await navigate({
      to: '/companies/$companyId/integrations/$connectionId',
      params: { companyId, connectionId: target.id },
      search: { testar: true },
    })
  }

  async function submit(values: Record<string, string>) {
    const { [NAME]: name = '', ...credential } = values
    try {
      if (oauth) {
        await go({ connector: entry.id, name })
        // The window stays as it is, busy: the browser is leaving for the provider.
        setLeaving(true)
        return
      }
      if (reconnecting === undefined)
        throw new RangeError('A first link by keys opens the window Ligar')
      await reconnect(reconnecting, credential)
    } catch (error) {
      // Someone changed the list meanwhile: it is read again behind the window.
      if (error instanceof HubFailure && LIST_CHANGED.has(error.code)) {
        void queryClient.invalidateQueries({ queryKey: connectionsPrefix(companyId) })
      }
      setWriteError(form, error, UNCONFIRMED, {
        CONNECTION_NAME_INVALID: NAME,
        CONNECTION_NAME_TAKEN: NAME,
      })
    }
  }

  return (
    <Form form={form} onSubmit={submit} fill>
      <DialogBody>
        <fieldset
          disabled={form.formState.isSubmitting || leaving}
          className={cn(
            'grid min-w-0 gap-xl',
            !oauth && 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]',
          )}
        >
          <Fields entry={entry} reconnecting={reconnecting} />
        </fieldset>
      </DialogBody>
      <DialogFooter>
        <FormAlert />
        <Buttons entry={entry} leaving={leaving} onClose={props.onClose} />
      </DialogFooter>
    </Form>
  )
}

/** Asks the Hub for the address of the provider's authorization and goes there; the page leaves, so nothing is reset. */
function useSignInStart(companyId: CompanyId) {
  const start = useMutation(sendSignInStart)
  return async function go(
    body: { connector: string; name: string } | { connectionId: Connection['id'] },
  ) {
    const { url } = await start.mutateAsync({ params: { companyId }, body })
    globalThis.location.assign(url)
  }
}

/** The window "Ligar" opens, in the middle of the screen like "Novo projeto"; with `reconnecting`, the keys of that connection again. */
export function LinkDialog(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  reconnecting?: Connection
  onClose: () => void
}) {
  const oauth = props.entry.auth === 'oauth2_code'
  return (
    <Dialog open onOpenChange={(open) => open || props.onClose()}>
      <DialogContent
        title={props.reconnecting ? RECONNECT : `Ligar ${props.entry.name}`}
        description={
          oauth
            ? signInWindowText(props.entry.name)
            : 'As chaves ficam guardadas no Hub e não aparecem de novo.'
        }
        size={oauth ? 'ask' : 'fields'}
      >
        <LinkForm {...props} reconnecting={props.reconnecting} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * "Conectar de novo" on a refused connection: for an OAuth connector it goes straight to the
 * provider, with no window; for pasted keys it opens the window with the name fixed.
 */
export function ReconnectButton(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connection: Connection
}) {
  const { companyId, entry, connection } = props
  const go = useSignInStart(companyId)
  const [keys, setKeys] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)

  async function reconnect() {
    setBusy(true)
    setFailure(null)
    try {
      await go({ connectionId: connection.id })
    } catch (error) {
      setBusy(false)
      setFailure(error)
    }
  }
  return (
    <div className="flex flex-col items-start gap-sm">
      <Button
        variant="primary"
        disabled={busy}
        onClick={entry.auth === 'oauth2_code' ? () => void reconnect() : () => setKeys(true)}
      >
        {RECONNECT}
      </Button>
      {failure !== null && <Alert tone="danger">{sentenceOf(failure)}</Alert>}
      {keys && (
        <LinkDialog
          companyId={companyId}
          entry={entry}
          connections={[]}
          reconnecting={connection}
          onClose={() => setKeys(false)}
        />
      )}
    </div>
  )
}
