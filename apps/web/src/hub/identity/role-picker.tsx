import type { ConnectorEntry } from '@conexus/hub-api'
import { useId, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import { ConnectorLogo } from '../connectors/public.ts'
import { EFFECT_WORD, NO_USE } from './role-text.ts'

type ConnectorSubject = ConnectorEntry['subjects'][number]

type PickerProps = {
  entry: ConnectorEntry
  /** The ids of the operations of this connector the role uses. */
  held: readonly string[]
  readOnly: boolean
  onChange: (next: string[]) => void
}

function Operation(props: {
  operation: ConnectorSubject['operations'][number]
  checked: boolean
  readOnly: boolean
  onChange: (on: boolean) => void
}) {
  const { operation } = props
  const id = useId()
  return (
    <li className="flex items-start gap-sm py-xs pl-xl">
      <Checkbox
        id={id}
        checked={props.checked}
        disabled={props.readOnly}
        onCheckedChange={props.onChange}
      />
      <label htmlFor={id} className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-baseline gap-x-sm">
          <span>{operation.label}</span>
          <span className="text-fact text-text-2">{EFFECT_WORD[operation.effect]}</span>
        </span>
        <span className="text-fact text-text-2">{operation.summary}</span>
      </label>
    </li>
  )
}

function Subject(props: { subject: ConnectorSubject } & Omit<PickerProps, 'entry'>) {
  const { subject, held, readOnly } = props
  const [open, setOpen] = useState(false)
  const id = useId()
  const ids = subject.operations.map((operation) => operation.id)
  const count = ids.filter((one) => held.includes(one)).length
  const state = count === 0 ? false : count === ids.length ? true : 'some'
  function setAll(on: boolean) {
    const others = held.filter((one) => !ids.includes(one))
    props.onChange(on ? [...others, ...ids] : others)
  }
  function setOne(operation: string, on: boolean) {
    props.onChange(on ? [...held, operation] : held.filter((one) => one !== operation))
  }
  return (
    <li className="flex flex-col border-t border-line py-xs first:border-t-0">
      <div className="flex items-center gap-sm">
        <Checkbox
          id={id}
          checked={state === true}
          indeterminate={state === 'some'}
          disabled={readOnly}
          onCheckedChange={setAll}
        />
        <label htmlFor={id} className="flex min-w-0 flex-1 items-baseline gap-sm">
          <span>{subject.label}</span>
          <span className="text-fact text-text-2">
            {count} de {ids.length}
          </span>
        </label>
        <Button
          size="sm"
          variant="ghost"
          aria-expanded={open}
          aria-label={`Detalhe de ${subject.label}`}
          onClick={() => setOpen((now) => !now)}
        >
          Detalhe
        </Button>
      </div>
      {open && (
        <ul className="flex flex-col pt-xs">
          {subject.operations.map((operation) => (
            <Operation
              key={operation.id}
              operation={operation}
              checked={held.includes(operation.id)}
              readOnly={readOnly}
              onChange={(on) => setOne(operation.id, on)}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/** One connector of the kit: its subjects with a box each, and under each the operations with what they do. */
export function ConnectorPicker(props: PickerProps) {
  const { entry, held } = props
  const inKit = new Set(entry.subjects.flatMap((one) => one.operations.map((each) => each.id)))
  const used = held.filter((one) => inKit.has(one)).length
  return (
    <section
      aria-label={entry.name}
      className="flex flex-col gap-sm rounded-control border border-line p-md"
    >
      <h3 className="flex items-center gap-sm font-body text-label font-semibold">
        <ConnectorLogo small entry={entry} />
        {entry.name}
        {used === 0 && <span className="font-normal text-text-2">{NO_USE}</span>}
      </h3>
      <ul className="flex flex-col">
        {entry.subjects.map((subject) => (
          <Subject
            key={subject.id}
            subject={subject}
            held={held}
            readOnly={props.readOnly}
            onChange={props.onChange}
          />
        ))}
      </ul>
    </section>
  )
}
