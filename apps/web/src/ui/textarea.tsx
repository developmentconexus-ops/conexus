import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's `textarea` (registry/new-york-v4/ui/textarea.tsx, read with `shadcn view`
// 4.21.5), painted like the brand's `input` row; it grows with its text, and focus shows on its own
// edge (design V28). Under `md` its text is 16px, so a phone's browser does not zoom into it.
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content max-h-48 min-h-9 w-full min-w-0 resize-none rounded-control border border-line bg-surface px-md py-sm text-base md:text-body text-text placeholder:text-text-2 focus-visible:outline-transparent not-data-[slot=input-group-control]:focus-visible:focus-field disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}
