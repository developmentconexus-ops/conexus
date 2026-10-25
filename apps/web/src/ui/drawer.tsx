import { Drawer as DrawerPrimitive } from '@base-ui/react/drawer'
import type { ReactNode } from 'react'
import { cn } from './cn.ts'

// Shaped after shadcn's bottom `drawer` on Base UI 1.9.0 (`swipeDirection` defaults to down), in the
// sheet's dress: the overlay is the canvas, a hairline separates the popup, and its slide stops
// under reduced motion (design V26). The popup clears the home indicator.
export function Drawer(props: DrawerPrimitive.Root.Props) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}

export function DrawerTrigger(props: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

export function DrawerClose(props: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

export function DrawerContent({
  className,
  title,
  children,
  ...props
}: DrawerPrimitive.Popup.Props & { title: string; children: ReactNode }) {
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-overlay"
        className="fixed inset-0 z-50 bg-canvas opacity-[calc(0.8*(1-var(--drawer-swipe-progress)))] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none"
      />
      <DrawerPrimitive.Viewport className="fixed inset-0 z-50 flex items-end">
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            'flex max-h-[85dvh] w-full flex-col gap-md rounded-t-card border-t border-line bg-surface px-lg pt-sm pb-[max(1rem,env(safe-area-inset-bottom))] text-text outline-none [transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-200 ease-out data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)] data-swiping:duration-0 motion-reduce:transition-none',
            className,
          )}
          {...props}
        >
          <div aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-pill bg-line" />
          <DrawerPrimitive.Title className="font-display text-title">{title}</DrawerPrimitive.Title>
          <DrawerPrimitive.Content className="flex min-h-0 flex-1 flex-col">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}
