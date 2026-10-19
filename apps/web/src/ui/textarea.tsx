import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's `textarea` (registry/new-york-v4/ui/textarea.tsx, read with `shadcn view`
// 4.21.5), painted like the brand's `input` row; it grows with its text.
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content max-h-48 min-h-9 w-full min-w-0 resize-none rounded-control border border-line bg-surface px-md py-sm text-body text-text placeholder:text-text-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  )
}
