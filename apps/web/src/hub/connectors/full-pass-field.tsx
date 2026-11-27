import type { LakeFullPass } from '@conexus/hub-api'
import { Field } from '../../ui/field.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { FULL_PASS, FULL_PASS_MANUAL } from './lake-text.ts'
import { FULL_PASS_ITEMS } from './lake-words.ts'

export function FullPassField(props: {
  value: LakeFullPass
  manual: boolean
  onChange: (next: LakeFullPass) => void
  children: React.ReactNode
}) {
  return (
    <Field>
      <span className="font-body text-label text-text">{FULL_PASS}</span>
      <ChoiceSelect
        label={FULL_PASS}
        value={props.value}
        items={FULL_PASS_ITEMS}
        disabled={props.manual}
        onValueChange={(next) => {
          const chosen = FULL_PASS_ITEMS.find((one) => one.value === next)
          if (chosen) props.onChange(chosen.value)
        }}
        className="w-full sm:w-80"
      />
      {props.manual ? <p className="text-text-2">{FULL_PASS_MANUAL}</p> : props.children}
    </Field>
  )
}
