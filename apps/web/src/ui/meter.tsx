import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { cn } from './cn.ts'

// Base UI's `meter`, shaped as shadcn's base Progress: a root holding a `MeterLabel` and the bar, which
// is a track and its fill, with the value for a screen reader. The bar takes the colour of the text
// around it, the track at 15%, so a caller tones the root with a `text-*` class.
export function Meter({ className, children, ...props }: MeterPrimitive.Root.Props) {
  return (
    <MeterPrimitive.Root data-slot="meter" className={cn('w-full', className)} {...props}>
      {children}
      <MeterPrimitive.Track className="h-1.5 w-full overflow-hidden rounded-pill bg-current/15">
        <MeterPrimitive.Indicator className="bg-current" />
      </MeterPrimitive.Track>
    </MeterPrimitive.Root>
  )
}

export function MeterLabel(props: MeterPrimitive.Label.Props) {
  return <MeterPrimitive.Label data-slot="meter-label" {...props} />
}
