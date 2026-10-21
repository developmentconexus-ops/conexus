import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'
import { Input } from './input.tsx'
import { Textarea } from './textarea.tsx'

// Copied from shadcn's base-nova `input-group`, painted with brand tokens: the border, the radius
// and the focus are the group's, and its field takes none; a busy group (`data-busy`) turns its
// ring ipê instead. Only a disabled field dims the group, not a disabled button beside it.
export function InputGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      data-focus-frame
      className={cn(
        'group/input-group relative flex h-9 w-full min-w-0 items-center rounded-control border border-line bg-surface has-[[data-slot=input-group-control]:disabled]:opacity-50 not-data-busy:has-[[data-slot=input-group-control]:focus-visible]:focus-field data-busy:has-[[data-slot=input-group-control]:focus-visible]:focus-ring has-[[data-slot][aria-invalid=true]]:border-danger has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto',
        className,
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  'flex h-auto items-center justify-center gap-sm py-xs text-label text-text-2 select-none [&>svg:not([class*="size-"])]:size-4',
  {
    variants: {
      align: {
        'inline-start': 'order-first pl-md',
        'inline-end': 'order-last pr-md',
        'block-start': 'order-first w-full justify-start px-md pt-sm',
        'block-end': 'order-last w-full justify-start px-md pb-sm',
      },
    },
    defaultVariants: { align: 'inline-start' },
  },
)

export function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      {...props}
    />
  )
}

export function InputGroupButton({
  type = 'button',
  variant = 'ghost',
  size = 'icon',
  ...props
}: ComponentProps<typeof Button>) {
  return <Button type={type} variant={variant} size={size} {...props} />
}

export function InputGroupInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'flex-1 rounded-none border-0 bg-transparent focus-visible:outline-transparent',
        className,
      )}
      {...props}
    />
  )
}

export function InputGroupTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'flex-1 rounded-none border-0 bg-transparent focus-visible:outline-transparent',
        className,
      )}
      {...props}
    />
  )
}
