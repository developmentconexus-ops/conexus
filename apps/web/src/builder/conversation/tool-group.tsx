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
import { doneText } from './text.ts'
import { presentTool, toolStatus } from './tool-registry.ts'
import { ToolRow } from './tool-row.tsx'
import { summaryOfTools } from './tool-summary.ts'

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

  const summary = summaryOfTools(tools, room)

  const completedCount = tools.filter((t) => toolStatus(t, room) !== 'running').length
  const stepIcons = [...new Set(tools.map((t) => presentTool(t, toolStatus(t, room), room).icon))]
  const failedCount = tools.filter((t) => {
    const status = toolStatus(t, room)
    return status === 'error' || status === 'denied'
  }).length

  return (
    <TraceCollapsible open={chosen ?? working} onOpenChange={setChosen} className="@container">
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
                <span className="@2xl:hidden">{summary.short}</span>
                <span className="hidden @2xl:inline">{summary.full}</span>
              </>
            )}
          </TraceTitle>
          {working ? (
            <TraceDescription>
              {completedCount}/{tools.length}
            </TraceDescription>
          ) : (
            <>
              <span aria-hidden="true" className="flex shrink-0 items-center gap-xs text-text-2">
                {stepIcons.map((Icon) => (
                  <Icon key={Icon.displayName ?? Icon.name} className="size-3.5" />
                ))}
              </span>
              <TraceDescription className="shrink-0">
                {doneText(tools.length - failedCount, failedCount)}
              </TraceDescription>
            </>
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
