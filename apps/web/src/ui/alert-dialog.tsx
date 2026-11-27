import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import type { ReactNode } from 'react'
import { cn } from './cn.ts'

// Base UI 1.9.0's `AlertDialog`, in the sheet's dress: the overlay is the canvas, a hairline
// separates the popup, and its fade stops under reduced motion (design V26). A click outside does
// not close it; Escape and its own buttons do. A `card` is a small card in the middle at every
// width; a `page` fills the screen under `sm`, for a card that shows a text to read before the yes.
const SHAPE = {
  card: 'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-column -translate-x-1/2 -translate-y-1/2 rounded-card border border-transparent',
  page: 'inset-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100%-2rem)] sm:max-w-column sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:border sm:border-transparent',
} as const

export function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

export function AlertDialogContent({
  className,
  title,
  description,
  size = 'card',
  children,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  title: string
  description: string
  size?: keyof typeof SHAPE
  children: ReactNode
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-canvas opacity-80 transition-opacity duration-window data-ending-style:opacity-0 data-starting-style:opacity-0"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          'fixed z-50 flex flex-col gap-lg overflow-y-auto bg-raised shadow-float p-lg text-text transition-opacity duration-window data-ending-style:opacity-0 data-starting-style:opacity-0',
          SHAPE[size],
          className,
        )}
        {...props}
      >
        <AlertDialogPrimitive.Title className="break-words font-display text-title">
          {title}
        </AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="text-text-2">
          {description}
        </AlertDialogPrimitive.Description>
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  )
}
