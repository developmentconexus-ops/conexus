import { Input as InputPrimitive } from '@base-ui/react/input'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

/**
 * Chromium's own calendar button is a Tab stop inside a date field, where the field matches neither
 * `:focus-visible` nor `:focus`: the field keeps its focus while any part of it holds focus (V28).
 */
const DATE_FOCUS = 'focus-within:outline-transparent focus-within:focus-field'

// Copied from shadcn's base-nova `input`, painted with the brand's `input` row: white, its edge a
// shadow (design V19). Alone, focus shows on its own edge (design V28); in a group, on the group's.
// Under `md` its text is 16px, as shadcn's is: a phone's browser zooms the page into a field with
// smaller text.
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-control border border-transparent bg-raised shadow-1 px-md text-base md:text-body text-text placeholder:text-text-2 focus-visible:outline-transparent not-data-[slot=input-group-control]:focus-visible:focus-field disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        props.type === 'date' && DATE_FOCUS,
        className,
      )}
      {...props}
    />
  )
}
