import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `separator`, painted with the hairline token (`line`).
export function Separator({
  className,
  orientation = 'horizontal',
}: {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        'shrink-0 bg-line data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
        className,
      )}
    />
  )
}
