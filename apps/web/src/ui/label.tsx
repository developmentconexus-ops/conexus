import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `label`; a label here always names its control.
export function Label({
  className,
  htmlFor,
  children,
  ...props
}: ComponentProps<'label'> & { htmlFor: string }) {
  return (
    <label
      data-slot="label"
      htmlFor={htmlFor}
      className={cn(
        'flex items-center gap-sm font-body text-label text-text select-none',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  )
}
