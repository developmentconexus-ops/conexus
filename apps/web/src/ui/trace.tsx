import { ChevronRightIcon } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from './cn.ts'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible.tsx'

// Copied from shadcn's base-nova `trace` (registry item #12307), painted with brand tokens. A
// running line's title shimmers (`brand/tokens.css`), still under reduced motion.
export function Trace({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="trace"
      className={cn('flex w-full min-w-0 flex-col gap-sm', className)}
      {...props}
    />
  )
}

export function TraceLine({
  className,
  status,
  ...props
}: ComponentProps<'span'> & { status?: 'running' | 'error' | 'pending' }) {
  return (
    <span
      data-slot="trace-line"
      data-status={status}
      className={cn(
        'flex w-fit max-w-full min-w-0 items-center gap-sm text-body text-text-2 data-[status=error]:text-danger data-[status=pending]:opacity-60 data-[status=running]:*:data-[slot=trace-title]:shimmer',
        className,
      )}
      {...props}
    />
  )
}

export function TraceIcon({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="trace-icon"
      aria-hidden="true"
      className={cn(
        'flex size-4 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export function TraceTitle({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="trace-title"
      className={cn('min-w-0 truncate motion-reduce:shimmer-none', className)}
      {...props}
    />
  )
}

export function TraceDescription({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="trace-description"
      className={cn('shrink-0 text-text-2 tabular-nums', className)}
      {...props}
    />
  )
}

export function TraceCollapsible({ className, ...props }: ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible
      data-slot="trace-collapsible"
      className={cn('flex w-full min-w-0 flex-col', className)}
      {...props}
    />
  )
}

export function TraceCollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleTrigger>) {
  return (
    <CollapsibleTrigger
      data-slot="trace-collapsible-trigger"
      className={cn(
        'group/trace-collapsible-trigger flex w-fit max-w-full min-w-0 cursor-pointer items-center gap-xs rounded-control text-left text-text-2 hover:text-text has-[[data-status=error]]:text-danger',
        className,
      )}
      {...props}
    >
      {children}
      <TraceIcon className="group-aria-expanded/trace-collapsible-trigger:rotate-90 motion-safe:transition-transform">
        <ChevronRightIcon />
      </TraceIcon>
    </CollapsibleTrigger>
  )
}

export function TraceCollapsibleContent({
  className,
  children,
  ...props
}: ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="trace-collapsible-content"
      className="h-(--collapsible-panel-height) min-w-0 overflow-hidden motion-safe:transition-[height] motion-safe:duration-200 data-ending-style:h-0 data-starting-style:h-0"
      {...props}
    >
      <div
        data-slot="trace-collapsible-content-inner"
        className={cn(
          'mt-sm mb-xs ml-[calc(var(--spacing-sm)-1px)] min-w-0 border-l border-line pr-xs pl-lg leading-relaxed wrap-break-word text-text-2',
          className,
        )}
      >
        {children}
      </div>
    </CollapsibleContent>
  )
}
