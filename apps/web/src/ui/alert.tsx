import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Adapted from shadcn's base-nova `alert`: one line of text, no box. Colour carries the tone and
// the words carry the meaning (design V35); the role is what makes a reader announce it (web W23).
const alertVariants = cva('font-body text-label', {
  variants: {
    tone: {
      danger: 'text-danger',
    },
  },
})

export function Alert({
  className,
  tone,
  ...props
}: Omit<ComponentProps<'p'>, 'role'> & Required<VariantProps<typeof alertVariants>>) {
  return (
    <p
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  )
}
