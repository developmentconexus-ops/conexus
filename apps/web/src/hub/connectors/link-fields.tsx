import type { Connection, ConnectorEntry } from '@conexus/hub-api'
import { ConnectionName } from '@conexus/hub-api'
import { ExternalLinkIcon } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { TextField } from '../../ui/form.tsx'
import { NAME_LABEL, NAME_NEEDED } from './lake-text.ts'

export const NAME = 'name'

/** Each field of the connector pasted whole, checked by the length the kit declares. */
export function fieldsShape(fields: ConnectorEntry['fields']) {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      z
        .string()
        .min(1, `Cole ${field.label}.`)
        .max(field.maxLength, `${field.label} passa de ${field.maxLength} letras.`),
    ]),
  )
}

/** The form's schema: the name the company gives the connection, then each of the connector's fields pasted whole. */
export function schemaOf(entry: ConnectorEntry) {
  return z.object({ [NAME]: ConnectionName, ...fieldsShape(entry.fields) })
}

/** The name offered: the connector's own, unless the company already has a connection of it by that name. */
export function suggestedName(entry: ConnectorEntry, connections: readonly Connection[]): string {
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

/** One text field for each field of the connector: the visible ones in clear, the rest hidden. */
export function KeyFields({ fields }: { fields: ConnectorEntry['fields'] }) {
  return fields.map((field) => (
    <TextField
      key={field.name}
      name={field.name}
      label={field.label}
      type={field.visible ? 'text' : 'password'}
      autoComplete="off"
    />
  ))
}

export function BeforePasting({ entry }: { entry: ConnectorEntry }) {
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
export function Fields(props: {
  entry: ConnectorEntry
  reconnecting: Connection | undefined
  /** Whether the help of the keys goes before the fields; a window that draws it elsewhere says no. */
  help?: boolean
  /** What follows the last field, in the same column. */
  children?: React.ReactNode
}) {
  const { entry, reconnecting } = props
  return (
    <>
      {props.help !== false && entry.auth !== 'oauth2_code' && <BeforePasting entry={entry} />}
      <div className="flex min-w-0 flex-col gap-lg">
        {reconnecting ? (
          <p className="font-medium">{reconnecting.name}</p>
        ) : (
          <TextField
            name={NAME}
            label={NAME_LABEL}
            type="text"
            autoComplete="off"
            invalid={NAME_NEEDED}
          />
        )}
        <KeyFields fields={entry.fields} />
        {props.children}
      </div>
    </>
  )
}

type AccessValues = z.infer<ReturnType<typeof schemaOf>>
export type AccessForm = UseFormReturn<AccessValues, unknown, AccessValues>
