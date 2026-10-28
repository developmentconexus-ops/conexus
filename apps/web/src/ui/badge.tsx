import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `badge`. A state is a word with a dot of its colour, never the
// colour alone (design V35).
const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center gap-xs whitespace-nowrap rounded-pill border border-line bg-surface px-sm font-body text-label before:size-1.5 before:rounded-pill before:bg-current before:content-['']",
  {
    variants: {
      tone: {
        neutral: 'text-text-2 before:hidden',
        success: 'text-success',
        warning: 'text-warning',
        danger: 'text-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}
