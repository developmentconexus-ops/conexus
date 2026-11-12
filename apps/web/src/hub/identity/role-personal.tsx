import { useId } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { Checkbox } from '../../ui/checkbox.tsx'
import { PERSONAL_HINT, PERSONAL_KINDS_SHOWN, PERSONAL_TITLE } from './role-text.ts'

function Kind(props: {
  label: string
  held: boolean
  readOnly: boolean
  onChange: (held: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start gap-sm py-xs">
      <Checkbox
        id={id}
        checked={props.held}
        disabled={props.readOnly}
        onCheckedChange={(checked) => props.onChange(checked === true)}
      />
      <label htmlFor={id} className="min-w-0 flex-1">
        {props.label}
      </label>
    </div>
  )
}

/**
 * The kinds of personal data of customers a role sees in the connectors' reads (decision A1): one
 * box per kind, in every role; fixed and ticked on the owner and the administrator. `sensivel`
 * is not offered, no role holds it (D1).
 */
export function PersonalKinds(props: { readOnly: boolean }) {
  const { control } = useFormContext()
  const { field } = useController({ name: 'personal', control })
  const held: string[] = field.value
  return (
    <section aria-label={PERSONAL_TITLE} className="flex flex-col gap-xs">
      <h3 className="font-body text-label font-semibold">{PERSONAL_TITLE}</h3>
      <p className="text-fact text-text-2">{PERSONAL_HINT}</p>
      {PERSONAL_KINDS_SHOWN.map(({ kind, label }) => (
        <Kind
          key={kind}
          label={label}
          held={held.includes(kind)}
          readOnly={props.readOnly}
          onChange={(on) =>
            field.onChange(on ? [...held, kind] : held.filter((one) => one !== kind))
          }
        />
      ))}
    </section>
  )
}
