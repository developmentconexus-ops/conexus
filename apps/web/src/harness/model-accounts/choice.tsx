import type { ComponentProps } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'

export type Option = { value: string; label: string }

/**
 * One choice among `options`, in the UI's select: `value` null says nothing is chosen yet, and the
 * trigger shows `placeholder`. `control` carries the attributes a field error ties to the trigger.
 */
export function Choice(props: {
  id: string
  value: string | null
  options: readonly Option[]
  placeholder: string
  onChange: (value: string) => void
  control?: ComponentProps<typeof SelectTrigger>
}) {
  return (
    <Select
      id={props.id}
      value={props.value}
      items={props.options}
      onValueChange={(next) => next !== null && props.onChange(next)}
    >
      <SelectTrigger {...props.control}>
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {props.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
