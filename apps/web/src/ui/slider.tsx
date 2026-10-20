import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from './cn.ts'

// Shaped after shadcn's base-nova `slider`, drawn as the old Raciocínio control
// (`composer.css`, `.cx-effort-slider`): a thick pill with a dot at each stop, filled in the accent
// up to a round thumb inside it. `label` names the thumb, which is the `slider` the keyboard and
// screen readers reach. The thumb moves only by the value, with no transition of its own, so
// reduced motion has nothing to stop.
export function Slider({
  className,
  label,
  getAriaValueText,
  ...props
}: SliderPrimitive.Root.Props<number> & {
  label: string
  getAriaValueText?: (formattedValue: string, value: number) => string
}) {
  const { min = 0, max = 100, step = 1 } = props
  const at = props.value ?? props.defaultValue ?? min
  const stops = Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, n) => min + n * step)
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      thumbAlignment="edge"
      className={cn('w-full min-w-0', className)}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-7 w-full touch-none items-center select-none data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-7 w-full grow overflow-hidden rounded-pill bg-surface-4 select-none"
        >
          {/* The fill reaches past the thumb's centre to its far edge, as the old pill's did. */}
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="box-content rounded-pill bg-accent pr-3.5 select-none"
          />
          <span aria-hidden="true" className="absolute inset-x-3.5 inset-y-0 flex justify-between">
            {stops.map((stop) => (
              <span key={stop} className="relative w-0">
                <span
                  data-filled={stop < at || undefined}
                  className="absolute top-1/2 size-[5px] -translate-1/2 rounded-pill bg-line-strong data-filled:bg-on-accent/75"
                />
              </span>
            ))}
          </span>
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          aria-label={label}
          getAriaValueText={getAriaValueText}
          className="block size-[22px] shrink-0 rounded-pill bg-on-accent select-none lift has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-solid has-focus-visible:outline-accent"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
