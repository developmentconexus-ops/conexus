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
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { presentTool, summaryOfTools, toolStatus } from './tool-registry.ts'
import { ToolRow } from './tool-row.tsx'

/**
 * Three tools or more in a row, as one line (Criterion 9). While the answer still works it names the tool in
 * progress and how many are done, open; once it moves on it says what they did, closed. A person's
 * own opening or closing wins over both.
 */
export function ToolGroup(props: { tools: ToolItem[]; working: boolean }) {
  const { tools, working } = props
  const room = useRoom()
  const [chosen, setChosen] = useState<boolean>()
  const active = tools.findLast((t) => toolStatus(t, room) === 'running') ?? tools.at(-1)
  const failed = tools.some((t) => {
    const status = toolStatus(t, room)
    return status === 'error' || status === 'denied'
  })

  const activePresentation = active
    ? presentTool(active, toolStatus(active, room), room)
    : undefined

  const summary = summaryOfTools(tools)

  const completedCount = tools.filter((t) => toolStatus(t, room) !== 'running').length

  return (
    <TraceCollapsible open={chosen ?? working} onOpenChange={setChosen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={working ? 'running' : failed ? 'error' : undefined}>
          {working && activePresentation ? (
            <TraceIcon>
              <activePresentation.icon />
            </TraceIcon>
          ) : (
            <TraceIcon>{failed ? <CircleAlertIcon /> : <CheckIcon />}</TraceIcon>
          )}
          <TraceTitle>
            {working && activePresentation ? (
              activePresentation.sentence
            ) : (
              <>
                <span className="md:hidden">{summary.short}</span>
                <span className="hidden md:inline">{summary.full}</span>
              </>
            )}
          </TraceTitle>
          {working && (
            <TraceDescription>
              {completedCount}/{tools.length}
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
