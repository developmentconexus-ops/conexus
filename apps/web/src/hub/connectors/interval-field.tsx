import type { LakeInterval } from '@conexus/hub-api'
import { ChoiceField } from './choice-field.tsx'
import { INTERVAL } from './lake-text.ts'
import { INTERVAL_ITEMS } from './lake-words.ts'

/** The interval of the rounds, chosen from the seven the Hub accepts. */
export function IntervalField(props: {
  value: LakeInterval
  onChange: (next: LakeInterval) => void
  children?: React.ReactNode
}) {
  return (
    <ChoiceField
      label={INTERVAL}
      value={props.value}
      items={INTERVAL_ITEMS}
      onChange={props.onChange}
      className="w-full sm:w-48"
    >
      {props.children}
    </ChoiceField>
  )
}
