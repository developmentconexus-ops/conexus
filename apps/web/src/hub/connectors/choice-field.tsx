import { Field } from '../../ui/field.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'

export function ChoiceField<Value extends string>(props: {
  label: string
  value: Value
  items: { value: Value; label: string }[]
  onChange: (next: Value) => void
  disabled?: boolean
  className: string
  children?: React.ReactNode
}) {
  return (
    <Field>
      <span className="font-body text-label text-text">{props.label}</span>
      <ChoiceSelect
        label={props.label}
        value={props.value}
        items={props.items}
        disabled={props.disabled === true}
        onValueChange={(next) => {
          const chosen = props.items.find((one) => one.value === next)
          if (chosen) props.onChange(chosen.value)
        }}
        className={props.className}
      />
      {props.children}
    </Field>
  )
}
