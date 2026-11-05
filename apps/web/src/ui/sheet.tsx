import { Dialog as SheetPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

/**
 * What a header inside the sheet reserves so the sheet's own **Fechar** (`absolute top-md right-md`,
 * `size-control`) touches nothing of it: the close's side plus its inset on the right (md + control + md),
 * and a row as tall as the close plus its two insets, so the close sits at the row's vertical center.
 */
export const SHEET_CLOSE_ROOM = 'pr-14 min-h-14'

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
  titleClassName,
  closeClassName,
  closeLabel = 'Fechar navegação',
  closeDisabled = false,
  side = 'left',
  children,
  ...props
}: SheetPrimitive.Popup.Props & {
  title: string
  /** Hides the visible title (`sr-only`) when the content brings its own layout, like the drawer's rail. */
  titleClassName?: string
  /** Puts the close where the content leaves room for it (the drawer: first in the column, not over the content). */
  closeClassName?: string
  closeLabel?: string
  /** Turns the close off while the content holds something the person must not leave. */
  closeDisabled?: boolean
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
        <SheetPrimitive.Title
          className={cn('pt-[env(safe-area-inset-top)] font-display text-title', titleClassName)}
        >
          {title}
        </SheetPrimitive.Title>
        {children}
        <SheetPrimitive.Close
          data-slot="sheet-close"
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn('absolute top-md right-md', closeClassName)}
            />
          }
          aria-label={closeLabel}
          disabled={closeDisabled}
        >
          <XIcon aria-hidden="true" />
        </SheetPrimitive.Close>
      </SheetPrimitive.Popup>
    </SheetPrimitive.Portal>
  )
}
