import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
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

const itemClasses = cva(
  'inline-flex items-center justify-center rounded-control text-label text-text-2 hover:text-text data-pressed:bg-surface data-pressed:text-accent-text dark:data-pressed:bg-surface-4',
  {
    variants: {
      // `icon` is an item of one icon, 14px in a toolbar (design V34), as base-nova's `size`.
      size: {
        default: 'h-8 flex-1 px-md max-md:h-9 max-md:px-sm',
        icon: 'size-8 [&_svg]:size-3.5 [&_svg]:shrink-0',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

export function ToggleGroupItem({
  className,
  size,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof itemClasses>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(itemClasses({ size }), className)}
      {...props}
    />
  )
}
