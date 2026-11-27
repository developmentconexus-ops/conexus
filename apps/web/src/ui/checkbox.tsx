import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckIcon, MinusIcon } from 'lucide-react'
import { touchArea } from './button.tsx'
import { cn } from './cn.ts'

// Modelled on shadcn's base-nova `checkbox`: the lit ipê when on (design V5), a grey box with a
// ring when off, as the Switch's track. `indeterminate` is the box of a subject with only some of its
// operations.
export function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `peer ${touchArea} inline-flex size-5 shrink-0 items-center justify-center rounded-[7px] bg-surface-4 shadow-ring transition-colors duration-state ease-spring-state data-checked:lit data-indeterminate:lit data-disabled:cursor-not-allowed data-disabled:opacity-50`,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <MinusIcon aria-hidden="true" className="size-3.5 stroke-3" />
            ) : (
              <CheckIcon aria-hidden="true" className="size-3.5 stroke-3" />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  )
}
