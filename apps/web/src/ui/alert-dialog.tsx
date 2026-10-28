import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import type { ReactNode } from 'react'
import { cn } from './cn.ts'

// Base UI 1.9.0's `AlertDialog`, in the sheet's dress: the overlay is the canvas, a hairline
// separates the popup, and its fade stops under reduced motion (design V26). A click outside does
// not close it; Escape and its own buttons do.
export function AlertDialog(props: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

export function AlertDialogTrigger(props: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

export type AlertDialogContentProps = AlertDialogPrimitive.Popup.Props

export function AlertDialogContent({
  className,
  title,
  description,
  children,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop
        data-slot="alert-dialog-overlay"
        className="fixed inset-0 z-50 bg-canvas opacity-80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
      />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-column -translate-x-1/2 -translate-y-1/2 flex-col gap-lg overflow-y-auto rounded-card border border-line bg-surface p-lg text-text transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
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
