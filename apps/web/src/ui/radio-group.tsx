import { Radio as RadioPrimitive } from '@base-ui/react/radio'
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group'
import { cn } from './cn.ts'

// Shaped after shadcn's base-nova `radio-group`, painted with brand tokens: each choice is a pill
// that reads its checked state from the border and the accent.
export function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn('flex flex-wrap gap-xs', className)}
      {...props}
    />
  )
}

export function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        'rounded-control border border-line px-sm py-xs text-label text-text-2 data-checked:border-accent data-checked:bg-accent-soft data-checked:text-accent-text',
        className,
      )}
      {...props}
    />
  )
}
