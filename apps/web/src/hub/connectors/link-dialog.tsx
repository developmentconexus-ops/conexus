import type { CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { ConnectionName } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'
import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { Dialog, DialogBody, DialogContent, DialogFooter } from '../../ui/dialog.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import {
  connectionKeys,
  connectionsPrefix,
  sendLink,
  sendReconnect,
  sendSignInStart,
} from './queries.ts'
import { continueText, RECONNECT, signInWindowText } from './text.ts'

const UNCONFIRMED = 'Não confirmamos a ligação. Tente de novo.'
const NAME = 'name'
const LIST_CHANGED: ReadonlySet<string> = new Set(['CONNECTION_NAME_TAKEN', 'CONNECTOR_UNKNOWN'])

/** The form's schema: the name the company gives the connection, then each of the connector's fields pasted whole. */
function schemaOf(entry: ConnectorEntry) {
  return z.object({
    [NAME]: ConnectionName,
    ...Object.fromEntries(
      entry.fields.map((field) => [
        field.name,
        z
          .string()
          .min(1, `Cole ${field.label}.`)
          .max(field.maxLength, `${field.label} passa de ${field.maxLength} letras.`),
      ]),
    ),
  })
}

/** The name offered: the connector's own, unless the company already has a connection of it by that name. */
function suggestedName(entry: ConnectorEntry, connections: readonly Connection[]): string {
  const taken = connections.some((one) => one.connector === entry.id && one.name === entry.name)
  return taken ? '' : entry.name
}

/** What the provider's help says, each text once with the fields it covers and where to find them. */
function helpOf(entry: ConnectorEntry) {
  const helps = new Map<string, { text: string; url: string; labels: string[] }>()
  for (const field of entry.fields) {
    const { text, url } = field.help
    const same = helps.get(`${text}\n${url}`) ?? { text, url, labels: [] }
    same.labels.push(field.label)
    helps.set(`${text}\n${url}`, same)
  }
  return [...helps.values()]
}

function BeforePasting({ entry }: { entry: ConnectorEntry }) {
  return (
    <section
      aria-label="Antes de colar"
      className="flex flex-col gap-sm self-start rounded-control border border-line bg-surface-3 p-md"
    >
      <h3 className="font-medium">Antes de colar</h3>
      <ol className="flex list-decimal flex-col gap-sm pl-lg">
        {helpOf(entry).map((help) => (
          <li key={help.url + help.text}>
            <span className="font-medium">{help.labels.join(', ')}</span>: {help.text}{' '}
            <a
              href={help.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Onde achar ${help.labels.join(', ')}`}
              className="inline-flex items-center gap-xs underline underline-offset-2"
            >
              Onde achar
              <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** What the window holds beside the name: the help and the fields of pasted keys, or nothing for a trip to the provider. */
function Fields(props: { entry: ConnectorEntry; reconnecting: Connection | undefined }) {
  const { entry, reconnecting } = props
  return (
    <>
      {entry.auth !== 'oauth2_code' && <BeforePasting entry={entry} />}
      <div className="flex min-w-0 flex-col gap-lg">
        {reconnecting ? (
          <p className="font-medium">{reconnecting.name}</p>
        ) : (
          <TextField
            name={NAME}
            label="Nome da ligação"
            type="text"
            autoComplete="off"
            invalid="Dê um nome à ligação, de até 60 letras."
          />
        )}
        {entry.fields.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.visible ? 'text' : 'password'}
            autoComplete="off"
          />
        ))}
      </div>
    </>
  )
}

/** The window's buttons: the way on, which busy means the browser is leaving, and Cancelar. */
function Buttons(props: {
  entry: ConnectorEntry
  reconnecting: Connection | undefined
  leaving: boolean
  onClose: () => void
}) {
  const { entry, reconnecting, leaving } = props
  const { formState } = useFormContext()
  const busy = formState.isSubmitting || leaving
  return (
    <div className="flex flex-wrap gap-md">
      {entry.auth === 'oauth2_code' ? (
        <Button type="submit" variant="primary" disabled={busy}>
          {continueText(entry.name)}
        </Button>
      ) : (
        <SubmitButton idle={reconnecting ? RECONNECT : 'Ligar e testar'} pending="Ligando…" />
      )}
      <Button type="button" disabled={busy} onClick={props.onClose}>
        Cancelar
      </Button>
    </div>
  )
}

/**
 * "Ligar e testar": the form builds itself from the catalog's fields, the Client ID to the eye and
 * the others hidden, and the name beside them. The Hub seals what is pasted and answers with the
 * connection, never the fields; the page of the connection opens and tests it. The attempt key
 * stays until the Hub settles the outcome (web W24); what the Hub refused stays in its fields.
 */
function LinkForm(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  reconnecting: Connection | undefined
  onClose: () => void
}) {
  const { companyId, entry, reconnecting } = props
  const send = useMutation(sendLink)
  const resend = useMutation(sendReconnect)
  const go = useSignInStart(companyId)
  const oauth = entry.auth === 'oauth2_code'
  const [leaving, setLeaving] = useState(false)
  const attempt = useAttemptKey()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useSchemaForm(schemaOf(entry), {
    [NAME]: reconnecting?.name ?? suggestedName(entry, props.connections),
    ...Object.fromEntries(entry.fields.map((field) => [field.name, ''])),
  })

  /** The pasted keys sealed by the Hub: a new connection, or the same one with its keys replaced. */
  function save(name: string, credential: Record<string, string>) {
    return reconnecting
      ? resend.mutateAsync({
          params: { companyId, connectionId: reconnecting.id },
          body: { credential },
        })
      : attempt((attemptKey) =>
          send.mutateAsync({
            params: { companyId },
            body: { connector: entry.id, name, credential },
            attemptKey,
          }),
        )
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
      const { connection } = await save(name, credential)
      form.reset()
      // A reconnect stays on the page it came from, so its window closes here; a first link leaves with the route.
      if (reconnecting) props.onClose()
      for (const queryKey of reconnecting
        ? connectionKeys(companyId, reconnecting.id)
        : [connectionsPrefix(companyId)]) {
        void queryClient.invalidateQueries({ queryKey })
      }
      await navigate({
        to: '/companies/$companyId/integrations/$connectionId',
        params: { companyId, connectionId: connection.id },
        search: { testar: true },
      })
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
        <Buttons
          entry={entry}
          reconnecting={reconnecting}
          leaving={leaving}
          onClose={props.onClose}
        />
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
      {failure !== null && (
        <p role="alert" className="text-danger">
          {sentenceOf(failure)}
        </p>
      )}
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
