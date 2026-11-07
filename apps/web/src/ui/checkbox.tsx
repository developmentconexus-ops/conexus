import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { CheckIcon, MinusIcon } from 'lucide-react'
import { touchArea } from './button.tsx'
import { cn } from './cn.ts'

// Modelled on shadcn's base-nova `checkbox`, painted like the Switch: ink when on, the brand's line
// when off. `indeterminate` is the box of a subject with only some of its operations.
export function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        `peer ${touchArea} inline-flex size-5 shrink-0 items-center justify-center rounded-control border border-line bg-surface text-surface transition-colors data-checked:border-ink data-checked:bg-ink data-indeterminate:border-ink data-indeterminate:bg-ink data-disabled:cursor-not-allowed data-disabled:opacity-50 motion-reduce:transition-none`,
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
              <MinusIcon aria-hidden="true" className="size-3.5" />
            ) : (
              <CheckIcon aria-hidden="true" className="size-3.5" />
            )}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  )
}
