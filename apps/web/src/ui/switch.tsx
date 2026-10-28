import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { touchArea } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `switch`: ink when on, the brand's line when off.
export function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        `peer ${touchArea} inline-flex h-5 w-9 shrink-0 items-center rounded-pill border border-transparent transition-colors data-checked:bg-ink data-unchecked:bg-surface-4 data-disabled:cursor-not-allowed data-disabled:opacity-50 motion-reduce:transition-none`,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-pill bg-surface transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0.5 motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  )
}
