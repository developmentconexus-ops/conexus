import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from './cn.ts'

// Shaped after shadcn's base-nova `slider`, painted with brand tokens: a hairline track, the filled
// part in the accent, and one round thumb. `label` names the thumb, which is the
// `slider` the keyboard and screen readers reach. The thumb moves only by the value, with no
// transition of its own, so reduced motion has nothing to stop.
export function Slider({
  className,
  label,
  getAriaValueText,
  ...props
}: SliderPrimitive.Root.Props<number> & {
  label: string
  getAriaValueText?: (formattedValue: string, value: number) => string
}) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      thumbAlignment="edge"
      className={cn('w-full min-w-0', className)}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1 w-full grow rounded-pill bg-surface-3 select-none"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="rounded-pill bg-accent select-none"
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          aria-label={label}
          getAriaValueText={getAriaValueText}
          className="block size-4 shrink-0 rounded-pill border border-accent bg-surface select-none has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-solid has-focus-visible:outline-accent"
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
