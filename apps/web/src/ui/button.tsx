import { Button as ButtonPrimitive } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `button`, painted with the brand's button rows (design V6, V27).
const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-sm whitespace-nowrap rounded-control border border-transparent font-body text-label outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-on-ink',
        default: 'border-line bg-surface text-text hover:bg-surface-3',
        ghost: 'bg-transparent text-text-2 hover:bg-surface-3 hover:text-text',
      },
      size: {
        // Icons follow their neighbour: 16px beside a label, 14px in a toolbar (design V34).
        default: 'h-[34px] px-[0.9rem] [&_svg]:size-4',
        icon: 'size-8 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
