import type { ToolGroupState } from '../../ui/ai/tool-group.tsx'
import { ToolGroup as Group } from '../../ui/ai/tool-group.tsx'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { doneText } from './text.ts'
import { presentTool, toolStatus } from './tool-registry.ts'
import { ToolRow } from './tool-row.tsx'
import { summaryOfTools } from './tool-summary.ts'

function failedOf(tool: ToolItem, room: Room): boolean {
  const status = toolStatus(tool, room)
  return status === 'error' || status === 'denied'
}

function groupState(tools: ToolItem[], working: boolean, room: Room): ToolGroupState {
  const active = tools.findLast((t) => toolStatus(t, room) === 'running') ?? tools.at(-1)
  if (working && active !== undefined) {
    const presented = presentTool(active, toolStatus(active, room), room)
    const completed = tools.filter((t) => toolStatus(t, room) !== 'running').length
    return {
      kind: 'WORKING',
      icon: presented.icon,
      sentence: presented.sentence,
      progress: `${completed}/${tools.length}`,
    }
  }
  const summary = summaryOfTools(tools, room)
  const failedCount = tools.filter((t) => failedOf(t, room)).length
  return {
    kind: 'DONE',
    failed: failedCount > 0,
    short: summary.short,
    full: summary.full,
    icons: [...new Set(tools.map((t) => presentTool(t, toolStatus(t, room), room).icon))],
    tally: doneText(tools.length - failedCount, failedCount),
  }
}

/**
 * Three tools or more in a row, as one line (Criterion 9, changed by the founder, 2026-11-13). While the answer
 * still works it names the tool in progress and how many are done; once it moves on it says what they did.
 * Closed in both: only the person's own click opens it.
 */
export function ToolGroup(props: { tools: ToolItem[]; working: boolean }) {
  const { tools, working } = props
  const room = useRoom()
  return (
    <Group state={groupState(tools, working, room)}>
      {tools.map((tool) => (
        <ToolRow key={tool.id} tool={tool} />
      ))}
    </Group>
  )
}
