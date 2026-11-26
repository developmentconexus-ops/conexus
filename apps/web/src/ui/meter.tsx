import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { cn } from './cn.ts'

// Base UI's `meter`, shaped as shadcn's base Progress: a root holding a `MeterLabel` and the bar, which
// is a track and its fill, with the value for a screen reader. The fill is the lit ipê (design V5);
// `fill="current"` takes the colour of the text around it instead, the track at 15%, for a caller
// that tones the root with a `text-*` class.
export function Meter({
  className,
  children,
  fill = 'lit',
  ...props
}: MeterPrimitive.Root.Props & { fill?: 'lit' | 'current' }) {
  return (
    <MeterPrimitive.Root data-slot="meter" className={cn('w-full', className)} {...props}>
      {children}
      <MeterPrimitive.Track
        className={cn(
          'h-1.5 w-full overflow-hidden rounded-pill',
          fill === 'lit' ? 'bg-surface-4' : 'bg-current/15',
        )}
      >
        <MeterPrimitive.Indicator className={fill === 'lit' ? 'lit' : 'bg-current'} />
      </MeterPrimitive.Track>
    </MeterPrimitive.Root>
  )
}

export function MeterLabel(props: MeterPrimitive.Label.Props) {
  return <MeterPrimitive.Label data-slot="meter-label" {...props} />
}
