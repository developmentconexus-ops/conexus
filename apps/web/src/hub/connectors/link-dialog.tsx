import type { CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { ConnectionName } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLinkIcon } from 'lucide-react'
import { z } from 'zod'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setWriteError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { connectionsPrefix, sendLink } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a ligação. Tente de novo.'
const NAME = 'name'
const LIST_CHANGED: ReadonlySet<string> = new Set(['CONNECTION_NAME_TAKEN', 'CONNECTOR_UNKNOWN'])

/** The form's schema: the name the company gives the connection, then each of the connector's fields pasted whole. */
function schemaOf(entry: ConnectorEntry) {
  return z.object({
    [NAME]: ConnectionName,
    ...Object.fromEntries(
      entry.fields.map((field) => [field.name, z.string().min(1).max(field.maxLength)]),
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
      className="flex flex-col gap-sm rounded-control border border-line bg-surface-3 p-md"
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
  onClose: () => void
}) {
  const { companyId, entry } = props
  const send = useMutation(sendLink)
  const attempt = useAttemptKey()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useSchemaForm(schemaOf(entry), {
    [NAME]: suggestedName(entry, props.connections),
    ...Object.fromEntries(entry.fields.map((field) => [field.name, ''])),
  })

  async function submit(values: Record<string, string>) {
    const { [NAME]: name = '', ...credential } = values
    try {
      const { connection } = await attempt((attemptKey) =>
        send.mutateAsync({
          params: { companyId },
          body: { connector: entry.id, name, credential },
          attemptKey,
        }),
      )
      form.reset()
      void queryClient.invalidateQueries({ queryKey: connectionsPrefix(companyId) })
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
    <Form form={form} onSubmit={submit}>
      <fieldset disabled={form.formState.isSubmitting} className="contents">
        <BeforePasting entry={entry} />
        <TextField
          name={NAME}
          label="Nome da ligação"
          type="text"
          autoComplete="off"
          invalid="Dê um nome à ligação, de até 60 letras."
        />
        {entry.fields.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.visible ? 'text' : 'password'}
            autoComplete="off"
            invalid={`Cole ${field.label}.`}
          />
        ))}
      </fieldset>
      <FormAlert />
      <div className="flex flex-wrap gap-md">
        <SubmitButton idle="Ligar e testar" pending="Ligando…" />
        <Button type="button" disabled={form.formState.isSubmitting} onClick={props.onClose}>
          Cancelar
        </Button>
      </div>
    </Form>
  )
}

/** The window "Ligar" opens, in the middle of the screen like "Novo projeto". */
export function LinkDialog(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => open || props.onClose()}>
      <DialogContent
        title={`Ligar ${props.entry.name}`}
        description="As chaves ficam guardadas no Hub e não aparecem de novo."
      >
        <LinkForm {...props} />
      </DialogContent>
    </Dialog>
  )
}
