import { useId } from 'react'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { isFuture } from './lake-pick.ts'
import { SINCE, SINCE_FUTURE, SINCE_HELP_EMPTY, SINCE_HELP_SET } from './lake-text.ts'

/** "Desde": the day the copy starts from, empty for the whole history; a day after today is refused where it is typed. */
export function SinceField(props: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  help?: boolean
}) {
  const id = useId()
  const future = isFuture(props.value)
  return (
    <Field className="sm:max-w-column">
      <FieldLabel htmlFor={id}>{SINCE}</FieldLabel>
      <Input
        id={id}
        type="date"
        disabled={props.disabled}
        aria-invalid={future || undefined}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
      <FieldError>{future ? SINCE_FUTURE : ''}</FieldError>
      {!future && props.help !== false && (
        <p className="text-text-2">{props.value === '' ? SINCE_HELP_EMPTY : SINCE_HELP_SET}</p>
      )}
    </Field>
  )
}
