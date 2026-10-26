import type { ComponentProps } from 'react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `attachment` (registry read with shadcn 4.22.1, 2026-10-26),
// painted with brand tokens and cut to what a chat uses: one small horizontal size, a file done.
export function Attachment({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment"
      className={cn(
        'group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 items-center gap-sm rounded-object border border-line bg-surface text-fact text-text p-xs pe-sm transition-colors has-data-[slot=attachment-action]:pe-xs',
        className,
      )}
      {...props}
    />
  )
}

export function AttachmentMedia({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-media"
      className={cn(
        'relative flex aspect-square w-8 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-3 text-text-2 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover [&_svg]:pointer-events-none [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export function AttachmentContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-content"
      className={cn('max-w-full min-w-0 flex-1 leading-tight', className)}
      {...props}
    />
  )
}

export function AttachmentTitle({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="attachment-title"
      className={cn('block max-w-48 min-w-0 truncate font-medium', className)}
      {...props}
    />
  )
}

export function AttachmentAction({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant="ghost"
      size="icon"
      className={cn('size-6', className)}
      {...props}
    />
  )
}

export function AttachmentGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        'flex min-w-0 snap-x snap-mandatory scroll-px-1 gap-sm overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start',
        className,
      )}
      {...props}
    />
  )
}
