import { useId } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { Checkbox } from '../../ui/checkbox.tsx'
import { UNATTENDED_ACTION, UNATTENDED_HINT } from './role-text.ts'

/**
 * The action of a role that no connector owns (step 24.5, Papéis `D1`): publishing an agent whose
 * write runs without asking. Fixed on the owner and the administrator, and off on the developer and
 * the member; only a role of the company's own changes it.
 */
export function UnattendedAction(props: { readOnly: boolean }) {
  const { control } = useFormContext()
  const { field } = useController({ name: 'unattended', control })
  const id = useId()
  return (
    <section aria-label="Agentes" className="flex flex-col gap-xs">
      <h3 className="font-body text-label font-semibold">Agentes</h3>
      <div className="flex items-start gap-sm py-xs">
        <Checkbox
          id={id}
          checked={field.value === true}
          disabled={props.readOnly}
          onCheckedChange={field.onChange}
        />
        <label htmlFor={id} className="flex min-w-0 flex-1 flex-col">
          <span>{UNATTENDED_ACTION}</span>
          <span className="text-fact text-text-2">{UNATTENDED_HINT}</span>
        </label>
      </div>
    </section>
  )
}
