import type { LakeFullPass } from '@conexus/hub-api'
import { ChoiceField } from './choice-field.tsx'
import { FULL_PASS, FULL_PASS_MANUAL } from './lake-text.ts'
import { FULL_PASS_ITEMS } from './lake-words.ts'

export function FullPassField(props: {
  value: LakeFullPass
  manual: boolean
  onChange: (next: LakeFullPass) => void
  children: React.ReactNode
}) {
  return (
    <ChoiceField
      label={FULL_PASS}
      value={props.value}
      items={FULL_PASS_ITEMS}
      disabled={props.manual}
      onChange={props.onChange}
      className="w-full sm:w-80"
    >
      {props.manual ? <p className="text-text-2">{FULL_PASS_MANUAL}</p> : props.children}
    </ChoiceField>
  )
}
