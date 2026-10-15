import { Input as InputPrimitive } from '@base-ui/react/input'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `input`, painted with the brand's `input` row.
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-control border border-line bg-surface px-md text-body text-text outline-none placeholder:text-text-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}
