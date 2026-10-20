import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `tooltip`, painted ink on on-ink. shadcn's enter and exit
// animations are left out: the brand has none for it and they would need reduced motion (V26).
export function TooltipProvider({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />
}

export function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

export function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

export function TooltipContent({
  className,
  side = 'top',
  sideOffset = 4,
  align = 'center',
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, 'align' | 'side' | 'sideOffset'>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            'z-50 w-fit max-w-column rounded-control bg-ink px-sm py-xs font-body text-label text-on-ink',
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}
