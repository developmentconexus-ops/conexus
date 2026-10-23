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
import { presentTool, summaryOfTools } from './tool-presentation.ts'
import { ToolRow } from './tool-row.tsx'
import type { ToolItem } from './transcript.ts'

function isToolRunning(tool: ToolItem): boolean {
  return tool.state === 'call' || tool.state === 'partial-call'
}

function isToolFailed(tool: ToolItem): boolean {
  return tool.isError === true || tool.state === 'output-error' || tool.state === 'output-denied'
}

/**
 * Three tools or more in a row, as one line (Criterion 9). While the answer still works it names the tool in
 * progress and how many are done, open; once it moves on it says what they did, closed. A person's
 * own opening or closing wins over both.
 */
export function ToolGroup(props: { tools: ToolItem[]; working: boolean }) {
  const { tools, working } = props
  const [chosen, setChosen] = useState<boolean>()
  const active = tools.findLast(isToolRunning) ?? tools.at(-1)
  const failed = tools.some(isToolFailed)

  const activePresentation = active
    ? presentTool(active.toolName, active.args, {
        isRunning: isToolRunning(active),
        isError: isToolFailed(active),
      })
    : undefined

  const summary = summaryOfTools(
    tools.map((t) => ({ toolName: t.toolName, isError: isToolFailed(t) })),
  )

  const completedCount = tools.filter((t) => !isToolRunning(t)).length

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
