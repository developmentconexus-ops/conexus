import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `marker`, painted with brand tokens; the `border` variant is
// left out. A notice or a failure sets its colour through `className`.
const markerVariants = cva(
  'group/marker relative flex min-h-4 w-full items-center gap-sm text-left text-body text-text-2 [&_svg:not([class*="size-"])]:size-4',
  {
    variants: {
      variant: {
        default: '',
        separator:
          'before:mr-xs before:h-px before:min-w-0 before:flex-1 before:bg-line after:ml-xs after:h-px after:min-w-0 after:flex-1 after:bg-line',
      },
    },
  },
)

export function Marker({
  className,
  variant = 'default',
  render,
  ...props
}: useRender.ComponentProps<'div'> & VariantProps<typeof markerVariants>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>({ className: cn(markerVariants({ variant }), className) }, props),
    render,
    state: { slot: 'marker', variant },
  })
}

export function MarkerIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn('size-4 shrink-0', className)}
      {...props}
    />
  )
}

export function MarkerContent({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        'min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center',
        className,
      )}
      {...props}
    />
  )
}
