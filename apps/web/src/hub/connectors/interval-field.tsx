import type { LakeInterval } from '@conexus/hub-api'
import { Field } from '../../ui/field.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { INTERVAL } from './lake-text.ts'
import { INTERVAL_ITEMS } from './lake-words.ts'

/** The interval of the rounds, chosen from the seven the Hub accepts. */
export function IntervalField(props: {
  value: LakeInterval
  onChange: (next: LakeInterval) => void
  children?: React.ReactNode
}) {
  return (
    <Field>
      <span className="font-body text-label text-text">{INTERVAL}</span>
      <ChoiceSelect
        label={INTERVAL}
        value={props.value}
        items={INTERVAL_ITEMS}
        onValueChange={(next) => {
          const chosen = INTERVAL_ITEMS.find((one) => one.value === next)
          if (chosen) props.onChange(chosen.value)
        }}
        className="w-full sm:w-48"
      />
      {props.children}
    </Field>
  )
}
