import { Button as ButtonPrimitive } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `button`, painted with the brand's button rows (design V6, V27).
const buttonClasses = cva(
  'inline-flex shrink-0 items-center justify-center gap-sm whitespace-nowrap rounded-control border border-transparent font-body text-label select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-on-ink',
        default: 'border-line bg-surface text-text hover:bg-surface-3',
        ghost: 'bg-transparent text-text-2 hover:bg-surface-3 hover:text-text',
        // A destructive action: neutral on the page, full danger only at its confirmation (V55).
        danger: 'border-line bg-surface text-danger hover:bg-surface-3',
        'danger-confirm': 'bg-danger text-on-ink',
      },
      size: {
        // Icons follow their neighbour: 16px beside a label, 14px in a toolbar (design V34). A phone's
        // finger needs 44 px.
        default: 'h-[34px] px-[0.9rem] max-md:h-11 [&_svg]:size-4',
        icon: 'size-8 max-md:size-11 [&_svg]:size-3.5 max-md:[&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

/**
 * A button's classes, merged: the base's transparent border gives way to a variant's own, also on a
 * link drawn as a button, which no `cn` reaches.
 */
export function buttonVariants(props?: VariantProps<typeof buttonClasses>): string {
  return cn(buttonClasses(props))
}

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonClasses>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
