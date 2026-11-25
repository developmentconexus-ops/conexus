import type { CompanyId, Connection, ConnectionLink, ConnectorEntry } from '@conexus/hub-api'
import { ConnectionName } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { CopyIcon } from 'lucide-react'
import { useState } from 'react'
import { clockOf } from '../../platform/dates.ts'
import { sentenceOf, sentenceOfCode } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import {
  BACK,
  BACK_TO_ACCESS,
  COPY_LINK,
  linkNextText,
  linkValidText,
  MAKE_LINK,
  MAKING_LINK,
  NAME_LABEL,
  NAME_NEEDED,
  SEND_PICK,
} from './lake-text.ts'
import { useMay } from './may.ts'
import { sendConnectionLink } from './queries.ts'

/** The address the other person opens, given once, with the time it stops working. */
function Made(props: { link: ConnectionLink }) {
  const may = useMay()
  const copy = useMutation({
    mutationFn: (text: string) => navigator.clipboard.writeText(text),
  })
  return (
    <div role="status" className="flex flex-col gap-sm rounded-control border border-line p-md">
      <p className="break-all font-mono text-fact">{props.link.url}</p>
      <p className="flex flex-wrap items-center gap-x-md gap-y-xs">
        <Button size="sm" onClick={() => copy.mutate(props.link.url)}>
          <CopyIcon aria-hidden="true" />
          {COPY_LINK}
        </Button>
        <span className="text-text-2 tabular-nums">
          {linkValidText(props.link.expiresAt, clockOf)}
        </span>
      </p>
      <p className="max-w-message text-text-2">{linkNextText(may.manageCopies)}</p>
      {copy.error !== null && <Alert tone="danger">{sentenceOf(copy.error)}</Alert>}
    </div>
  )
}

/** What stops the name from being the connection's: empty, too long, or already one of this connector's; empty when it can be. */
function refusalOfName(
  name: string,
  entry: ConnectorEntry,
  connections: readonly Connection[],
): string {
  if (!ConnectionName.safeParse(name).success) return NAME_NEEDED
  const taken = connections.some((one) => one.connector === entry.id && one.name === name.trim())
  return taken ? sentenceOfCode('CONNECTION_NAME_TAKEN') : ''
}

/**
 * "Enviar link": the person marks the fields the other one fills, the rest being what was typed in
 * the window; the Hub answers with the address, given once. Nothing here is a connection yet.
 */
export function SendPanel(props: {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  name: string
  filled: Readonly<Record<string, string>>
  onBack: (name: string) => void
}) {
  const { entry } = props
  const [name, setName] = useState(props.name)
  const nameRefusal = refusalOfName(name, entry, props.connections)
  const [asked, setAsked] = useState<ReadonlySet<string>>(new Set())
  const make = useMutation(sendConnectionLink)
  const link = make.data

  function toggle(name: string, on: boolean) {
    const next = new Set(asked)
    if (on) next.add(name)
    else next.delete(name)
    setAsked(next)
  }

  function submit() {
    const kept = Object.entries(props.filled).filter(([name]) => !asked.has(name))
    make.mutate({
      params: { companyId: props.companyId },
      body: {
        connector: entry.id,
        name,
        asked: [...asked],
        filled: Object.fromEntries(kept.filter(([, value]) => value !== '')),
      },
    })
  }

  return (
    <div className="flex max-w-message flex-col gap-lg">
      <Field>
        <FieldLabel htmlFor="link-name">{NAME_LABEL}</FieldLabel>
        <Input
          id="link-name"
          autoComplete="off"
          value={name}
          disabled={link !== undefined || make.isPending}
          aria-invalid={nameRefusal !== ''}
          onChange={(event) => setName(event.target.value)}
        />
        <FieldError>{nameRefusal}</FieldError>
      </Field>
      <p className="text-text-2">{SEND_PICK}</p>
      <ul className="flex flex-col">
        {entry.fields.map((field) => (
          <li key={field.name} className="flex h-row items-center gap-md border-b border-line">
            <Checkbox
              id={`asked-${field.name}`}
              aria-label={field.label}
              checked={asked.has(field.name)}
              disabled={link !== undefined || make.isPending}
              onCheckedChange={(on) => toggle(field.name, on)}
            />
            <label htmlFor={`asked-${field.name}`}>{field.label}</label>
          </li>
        ))}
      </ul>
      {link !== undefined && <Made link={link} />}
      {make.error !== null && <Alert tone="danger">{sentenceOf(make.error)}</Alert>}
      <div className="flex flex-wrap gap-md">
        {link === undefined ? (
          <>
            <Button
              variant="primary"
              disabled={asked.size === 0 || nameRefusal !== '' || make.isPending}
              onClick={submit}
            >
              {make.isPending ? MAKING_LINK : MAKE_LINK}
            </Button>
            <Button onClick={() => props.onBack(name)}>{BACK}</Button>
          </>
        ) : (
          <Button variant="primary" onClick={() => props.onBack(name)}>
            {BACK_TO_ACCESS}
          </Button>
        )}
      </div>
    </div>
  )
}
