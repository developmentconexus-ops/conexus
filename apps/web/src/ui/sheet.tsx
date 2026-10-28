import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `sheet`: the left side is the phone drawer (V56), the right one a
// panel for a form beside the page. A hairline separates it, and the overlay is the canvas itself, since the brand has no overlay token.
// Its slide and fade stop under reduced motion (design V26).
export function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

const SIDES = {
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-drawer border-r data-ending-style:-translate-x-10 data-starting-style:-translate-x-10',
  right:
    'inset-y-0 right-0 h-full w-full max-w-message overflow-y-auto border-l data-ending-style:translate-x-10 data-starting-style:translate-x-10',
} as const

export function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

export function SheetContent({
  className,
  title,
  closeLabel = 'Fechar navegação',
  side = 'left',
  children,
  ...props
}: SheetPrimitive.Popup.Props & {
  title: string
  closeLabel?: string
  side?: keyof typeof SIDES
  children: ReactNode
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-canvas opacity-80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col gap-lg border-line bg-surface p-lg text-text transition duration-200 ease-in-out motion-reduce:transition-none data-ending-style:opacity-0 data-starting-style:opacity-0',
          SIDES[side],
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Title className="pt-[env(safe-area-inset-top)] font-display text-title">
          {title}
        </SheetPrimitive.Title>
        {children}
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={<Button variant="ghost" size="icon" className="absolute top-md right-md" />}
          aria-label={closeLabel}
        >
          <XIcon aria-hidden="true" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}
