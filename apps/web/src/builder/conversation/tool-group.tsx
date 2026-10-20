import { CheckIcon, CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import type { ToolPart } from './fold.ts'
import { ToolIcon, ToolRow } from './tool-row.tsx'
import { sentenceOf, summaryOf } from './tool-text.ts'

/**
 * Three tools or more in a row, as one line. While the answer still works it names the tool in
 * progress and how many are done, open; once it moves on it says what they did, closed. A person's
 * own opening or closing wins over both.
 */
export function ToolGroup(props: { tools: ToolPart[]; working: boolean }) {
  const { tools, working } = props
  const [chosen, setChosen] = useState<boolean>()
  const active = tools.findLast((tool) => tool.state === 'running') ?? tools.at(-1)
  const failed = tools.some((tool) => tool.state === 'error')
  return (
    <TraceCollapsible open={chosen ?? working} onOpenChange={setChosen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={working ? 'running' : failed ? 'error' : undefined}>
          {working && active !== undefined ? (
            <ToolIcon tool={active} />
          ) : (
            <TraceIcon>{failed ? <CircleAlertIcon /> : <CheckIcon />}</TraceIcon>
          )}
          <TraceTitle>
            {working && active !== undefined ? sentenceOf(active) : summaryOf(tools)}
          </TraceTitle>
          {working && (
            <TraceDescription>
              {tools.filter((tool) => tool.state !== 'running').length}/{tools.length}
            </TraceDescription>
          )}
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="flex flex-col gap-sm">
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
