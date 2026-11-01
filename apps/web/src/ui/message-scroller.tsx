import {
  MessageScroller as MessageScrollerPrimitive,
  useMessageScroller,
  useMessageScrollerScrollable,
} from '@shadcn/react/message-scroller'
import { ArrowDownIcon } from 'lucide-react'
import { Button } from './button.tsx'
import { cn } from './cn.ts'

// Copied from shadcn's base-nova `message-scroller` over `@shadcn/react`, painted with brand
// tokens; the scroll fade, the thin scrollbar and the hooks but `useMessageScroller` and
// `useMessageScrollerScrollable` are left out.

export { useMessageScroller, useMessageScrollerScrollable }

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

/** The keys that scroll toward the end; Shift+Space scrolls back. */
const TOWARD_END: ReadonlySet<string> = new Set(['ArrowDown', 'End', 'PageDown', ' '])

/** How near the end counts as the end: `@shadcn/react`'s own `scrollEdgeThreshold` default. */
const END_THRESHOLD = 8

function atEnd(viewport: HTMLElement): boolean {
  return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= END_THRESHOLD
}

/** iOS lets the finger pull the viewport past its end; letting go starts Safari's spring-back. */
function pulledPastEnd(viewport: HTMLElement): boolean {
  return viewport.scrollTop + viewport.clientHeight > viewport.scrollHeight
}

export function MessageScrollerViewport({
  className,
  onWheel,
  onKeyDown,
  onTouchEnd,
  ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) {
  const { scrollToEnd } = useMessageScroller()
  // `@shadcn/react` 0.3.1 stops following the end on any wheel, touch or scroll key, and follows
  // again only after a scroll that ends there. At the end such a gesture scrolls nothing, so the
  // person who is still at the end is followed again here.
  function stayAtEnd(viewport: HTMLElement) {
    if (atEnd(viewport)) scrollToEnd()
  }
  return (
    <MessageScrollerPrimitive.Viewport
      data-slot="message-scroller-viewport"
      className={cn(
        'size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain contain-content data-pending-scroll:invisible',
        className,
      )}
      onWheel={(event) => {
        if (event.deltaY >= 0) stayAtEnd(event.currentTarget)
        onWheel?.(event)
      }}
      onKeyDown={(event) => {
        if (TOWARD_END.has(event.key) && !(event.key === ' ' && event.shiftKey))
          stayAtEnd(event.currentTarget)
        onKeyDown?.(event)
      }}
      onTouchEnd={(event) => {
        // Scrolling to the end now would cut the spring-back short; the scroller's own follow
        // lands when it settles at the end.
        if (!pulledPastEnd(event.currentTarget)) stayAtEnd(event.currentTarget)
        onTouchEnd?.(event)
      }}
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

/** The button scrolls smoothly unless the person asked for less motion. */
function scrollBehavior(): ScrollBehavior {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function MessageScrollerButton({
  direction = 'end',
  behavior = scrollBehavior(),
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
      behavior={behavior}
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
