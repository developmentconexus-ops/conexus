import { Button as ButtonPrimitive } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `button`, painted with the brand's button rows (design V6, V27).
// Where a finger points, the press reaches 44 px around the visible control (Apple's 44 pt hit target,
// WCAG 2.5.5) without drawing it bigger.
export const touchArea =
  'relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:h-full pointer-coarse:after:min-h-11 pointer-coarse:after:w-full pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-1/2'

const buttonClasses = cva(
  `${touchArea} inline-flex shrink-0 items-center justify-center gap-sm whitespace-nowrap rounded-control border border-transparent font-body text-label select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
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
        // shadcn base-nova's heights. Icons follow their neighbour: 16px beside a label, 14px in a
        // toolbar (design V34). `sm` is a row's own action.
        default: 'h-8 px-3 [&_svg]:size-4',
        sm: 'h-7 px-2.5 [&_svg]:size-3.5',
        icon: 'size-8 [&_svg]:size-3.5',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
      },
      // A link that is a labelled button from `md` and the quiet icon button (`ghost`, `icon`) under it.
      phoneIcon: {
        true: 'max-md:size-8 max-md:border-transparent max-md:bg-transparent max-md:px-0 max-md:text-text-2 max-md:hover:bg-surface-3 max-md:hover:text-text max-md:[&_svg]:size-3.5',
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
  phoneIcon,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonClasses>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, phoneIcon }), className)}
      {...props}
    />
  )
}
