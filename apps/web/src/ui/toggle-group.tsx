import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { cn } from './cn.ts'

// Shaped after shadcn's base-nova `toggle-group`, painted with brand tokens: one pressed item at a
// time, laid out as a segmented control. On a phone the track is 44 px tall,
// its segments inset like the computer's.
export function ToggleGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn('flex w-full items-center gap-xs rounded-control bg-surface-3 p-xs', className)}
      {...props}
    />
  )
}

export function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        'inline-flex h-8 flex-1 items-center justify-center rounded-control px-md text-label text-text-2 hover:text-text data-pressed:bg-surface data-pressed:text-text max-md:h-9 max-md:px-sm',
        className,
      )}
      {...props}
    />
  )
}
