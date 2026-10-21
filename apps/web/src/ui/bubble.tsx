import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `bubble`, painted with brand tokens and cut to the two variants
// a turn uses: the person's `default` bubble and the Builder's plain `ghost` text.
const bubbleVariants = cva(
  'group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-xs group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full',
  {
    variants: {
      variant: {
        default: '*:data-[slot=bubble-content]:bg-surface-3 *:data-[slot=bubble-content]:text-text',
        ghost:
          '*:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export function Bubble({
  variant = 'default',
  align = 'start',
  className,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof bubbleVariants> & { align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  )
}

export function BubbleContent({ className, render, ...props }: useRender.ComponentProps<'div'>) {
  return useRender({
    defaultTagName: 'div',
    props: mergeProps<'div'>(
      {
        className: cn(
          'w-fit max-w-full min-w-0 overflow-hidden rounded-object border border-transparent px-md py-sm text-body wrap-break-word group-data-[align=end]/bubble:self-end',
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: 'bubble-content' },
  })
}
