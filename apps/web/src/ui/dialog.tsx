import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `dialog` (Base UI 1.9.0), in the alert dialog's dress: the overlay
// is the canvas, a hairline separates the popup, and its fade stops under reduced motion (design
// V26). A `form` dialog, the default, is a small card in the middle at every width; a `page` dialog,
// for reading a long text, takes the whole screen under `sm`. Its title is the popup's name, its
// description (when given) what the screen reader says after it; the close button says "Fechar"
// (design V31).
const SHAPE = {
  // A short ask, such as a name: a card in the middle at every width, like AlertDialog.
  form: 'top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-column -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-object border border-line',
  // Reading a long text: the whole screen under sm, a page-wide window above it.
  page: 'inset-0 overflow-hidden sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[calc(100dvh-4rem)] sm:w-[calc(100%-4rem)] sm:max-w-page sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-object sm:border sm:border-line',
} as const

export function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

export function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

export function DialogContent({
  className,
  title,
  description,
  size = 'form',
  children,
  ...props
}: DialogPrimitive.Popup.Props & {
  title: string
  description?: string
  size?: keyof typeof SHAPE
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-canvas opacity-80 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none"
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 flex flex-col gap-md bg-surface p-lg text-text transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none',
          SHAPE[size],
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-sm">
          <DialogPrimitive.Title className="min-w-0 flex-1 break-words font-display text-title">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close
            render={<Button variant="ghost" size="icon" aria-label="Fechar" />}
          >
            <XIcon aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>
        {description && (
          <DialogPrimitive.Description className="text-text-2">
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}
