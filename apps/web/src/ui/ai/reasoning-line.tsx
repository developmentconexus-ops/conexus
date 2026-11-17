import { BrainIcon } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../trace.tsx'

export type ReasoningState =
  | { kind: 'THINKING' }
  /** `body` is the reasoning the caller drew; `undefined` when it came empty, and the line does not open. */
  | { kind: 'DONE'; body: ReactNode | undefined }

/** The model's reasoning, on shadcn's reasoning recipe: a running line, then a line that opens on it, closed by default. */
export function ReasoningLine(props: { label: string; state: ReasoningState }): ReactElement {
  const { label, state } = props
  const [open, setOpen] = useState(false)
  if (state.kind === 'THINKING' || state.body === undefined) {
    return (
      <TraceLine status={state.kind === 'THINKING' ? 'running' : undefined}>
        <TraceIcon>
          <BrainIcon />
        </TraceIcon>
        <TraceTitle>{label}</TraceTitle>
      </TraceLine>
    )
  }
  return (
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine>
          <TraceIcon>
            <BrainIcon />
          </TraceIcon>
          <TraceTitle>{label}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="pt-xs text-text-2">
        <div className="rounded-control bg-surface-3 p-sm text-fact">{state.body}</div>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
