import type { LucideIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '../cn.ts'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../trace.tsx'

export type ToolLineState = { kind: 'RUNNING' } | { kind: 'DONE' } | { kind: 'FAILED' }

/** Beside the sentence: the call's detail, cut, or, while it runs without one, the clock the caller draws. */
export type ToolLineBeside =
  | { kind: 'DETAIL'; text: string }
  | { kind: 'CLOCK'; clock: ReactNode }
  | { kind: 'NONE' }

const STATUS = { RUNNING: 'running', DONE: undefined, FAILED: 'error' } as const

/**
 * One tool call as a line, on shadcn's tool recipe (a `TraceLine` until there is a body, then a
 * `TraceCollapsible`). The sentence is never cut; a detail beside it is. Closed until the person opens it.
 */
export function ToolLine(props: {
  icon: LucideIcon
  sentence: string
  state: ToolLineState
  beside: ToolLineBeside
  /** The body that opens the line, drawn by the caller; `undefined` is a line that does not open. */
  body: ReactNode | undefined
}): ReactElement {
  const { icon: Icon, sentence, state, beside, body } = props
  const [open, setOpen] = useState(false)
  const failed = state.kind === 'FAILED'
  const detailed = beside.kind === 'DETAIL'
  const wraps = failed && !detailed
  const line = (
    <TraceLine status={STATUS[state.kind]} className={cn(wraps && 'items-start')}>
      <TraceIcon className={wraps ? 'mt-1' : undefined}>
        <Icon />
      </TraceIcon>
      <TraceTitle
        className={detailed ? 'shrink-0 whitespace-nowrap' : cn(failed && 'whitespace-normal')}
      >
        {sentence}
      </TraceTitle>
      {beside.kind === 'DETAIL' && (
        <TraceDescription className="min-w-0 flex-1 shrink truncate text-right">
          {beside.text}
        </TraceDescription>
      )}
      {beside.kind === 'CLOCK' && beside.clock}
    </TraceLine>
  )
  if (body === undefined) return line
  return (
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>{body}</TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
