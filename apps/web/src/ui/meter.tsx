import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { cn } from './cn.ts'

// Base UI's `meter`: a track and its fill, with the value for a screen reader. Both take the
// colour of the text around them, the track at 15%, so a caller tones it with a `text-*` class.
// `label` names the meter, which has no visible label of its own.
export function Meter({
  className,
  label,
  ...props
}: MeterPrimitive.Root.Props & { label: string }) {
  return (
    <MeterPrimitive.Root
      data-slot="meter"
      aria-label={label}
      className={cn('w-full', className)}
      {...props}
    >
      <MeterPrimitive.Track className="h-1.5 w-full overflow-hidden rounded-pill bg-current/15">
        <MeterPrimitive.Indicator className="bg-current" />
      </MeterPrimitive.Track>
    </MeterPrimitive.Root>
  )
}
