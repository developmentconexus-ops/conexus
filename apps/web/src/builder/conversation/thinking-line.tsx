import { BrainIcon } from 'lucide-react'
import { useState } from 'react'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import { Markdown } from './markdown.tsx'
import { thoughtOf } from './tool-presentation.ts'
import type { ReasoningItem } from './transcript.ts'

/**
 * The reasoning disclosure (Criterion 9, V39 amended):
 * "Pensando…" while reasoning runs; then "Pensou por N s" (or "Pensou"), closed by default,
 * expanding on click to show the model's reasoning in Markdown.
 */
export function ThinkingLine({ part }: { part: ReasoningItem }) {
  const running = part.streaming
  const reasoning = part.reasoning.trim()
  const label = thoughtOf(part.seconds, running)
  const [open, setOpen] = useState(false)

  if (running || reasoning.length === 0) {
    return (
      <TraceLine status={running ? 'running' : undefined}>
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
        <div className="rounded-control bg-surface-3 p-sm text-fact">
          <Markdown text={reasoning} />
        </div>
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
