import type { ComponentProps } from 'react'
import { cn } from './cn.ts'
import { Label } from './label.tsx'

// Copied from shadcn's base-nova `field`, keeping only the parts a form of step 3 uses; a field
// holds one control, so it drops the group role Biome would turn into a fieldset.
export function FieldGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn('flex w-full flex-col gap-lg', className)}
      {...props}
    />
  )
}

export function Field({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="field" className={cn('flex w-full flex-col gap-sm', className)} {...props} />
  )
}

export function FieldLabel(props: ComponentProps<typeof Label>) {
  return <Label data-slot="field-label" {...props} />
}

export function FieldError({ className, ...props }: ComponentProps<'p'>) {
  if (!props.children) return null
  return (
    <p
      data-slot="field-error"
      className={cn('font-body text-label text-danger', className)}
      {...props}
    />
  )
}
