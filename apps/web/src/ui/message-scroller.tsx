import { MessageScroller as MessageScrollerPrimitive } from '@shadcn/react/message-scroller'
import { ArrowDownIcon } from 'lucide-react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `message-scroller` over `@shadcn/react`, painted with brand
// tokens; the scroll fade, the thin scrollbar and the hooks are left out.

export function MessageScrollerProvider(
  props: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>,
) {
  return <MessageScrollerPrimitive.Provider {...props} />
}

export function MessageScroller({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) {
  return (
    <MessageScrollerPrimitive.Root
      data-slot="message-scroller"
      className={cn(
        'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

export function MessageScrollerViewport({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        'size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain contain-content data-pending-scroll:invisible',
        className,
      )}
      {...props}
    />
  )
}

export function MessageScrollerContent({
  className,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) {
  return (
    <MessageScrollerPrimitive.Content
      data-slot="message-scroller-content"
      className={cn('flex h-max min-h-full flex-col gap-xl', className)}
      {...props}
    />
  )
}

export function MessageScrollerItem({
  className,
  scrollAnchor = false,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) {
  return (
    <MessageScrollerPrimitive.Item
      data-slot="message-scroller-item"
      scrollAnchor={scrollAnchor}
      className={cn('min-w-0 shrink-0', className)}
      {...props}
    />
  )
}

export function MessageScrollerButton({
  direction = 'end',
  className,
  children,
  render,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Button>) {
  return (
    <MessageScrollerPrimitive.Button
      data-slot="message-scroller-button"
      data-direction={direction}
      direction={direction}
      className={cn(
        'absolute inset-s-1/2 -translate-x-1/2 rounded-pill motion-safe:transition-[translate,scale,opacity] motion-safe:duration-200 data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[direction=end]:bottom-lg data-[direction=start]:top-lg data-[direction=start]:[&_svg]:rotate-180',
        className,
      )}
      render={render ?? <Button size="icon" />}
      {...props}
    >
      {children ?? (
        <>
          <ArrowDownIcon aria-hidden="true" />
          <span className="sr-only">
            {direction === 'end' ? 'Ir para o fim da conversa' : 'Ir para o começo da conversa'}
          </span>
        </>
      )}
    </MessageScrollerPrimitive.Button>
  )
}
