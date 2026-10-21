import type { ComponentProps } from 'react'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `message`, painted with brand tokens; the group and the avatar
// are left out, since a Builder turn carries the mark in its header.
export function Message({
  className,
  align = 'start',
  ...props
}: ComponentProps<'div'> & { align?: 'start' | 'end' }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        'group/message relative flex w-full min-w-0 gap-sm text-body data-[align=end]:flex-row-reverse',
        className,
      )}
      {...props}
    />
  )
}

export function MessageContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        'flex w-full min-w-0 flex-col gap-md wrap-break-word group-data-[align=end]/message:*:data-slot:self-end',
        className,
      )}
      {...props}
    />
  )
}

export function MessageHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        'flex max-w-full min-w-0 items-center gap-sm text-fact text-text-2 group-has-data-[variant=ghost]/message:px-0',
        className,
      )}
      {...props}
    />
  )
}

export function MessageFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        'flex max-w-full min-w-0 items-center text-fact text-text-2 group-data-[align=end]/message:justify-end',
        className,
      )}
      {...props}
    />
  )
}
