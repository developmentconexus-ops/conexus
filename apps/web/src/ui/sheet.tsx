import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `sheet`, keeping the left side the phone drawer uses (V56). A
// hairline separates it, and the overlay is the canvas itself, since the brand has no overlay token.
// Its slide and fade stop under reduced motion (design V26).
export function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

export function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

export function SheetContent({
  className,
  title,
  children,
  ...props
}: SheetPrimitive.Popup.Props & { title: string; children: ReactNode }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-canvas opacity-80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-3/4 max-w-drawer flex-col gap-lg border-r border-line bg-surface p-lg text-text transition duration-200 ease-in-out motion-reduce:transition-none data-ending-style:-translate-x-10 data-ending-style:opacity-0 data-starting-style:-translate-x-10 data-starting-style:opacity-0',
          className,
        )}
        {...props}
      >
        <SheetPrimitive.Title className="font-display text-title">{title}</SheetPrimitive.Title>
        {children}
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={<Button variant="ghost" size="icon" className="absolute top-md right-md" />}
          aria-label="Fechar navegação"
        >
          <XIcon aria-hidden="true" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}
