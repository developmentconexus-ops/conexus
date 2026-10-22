import type { MessagePart } from '@conexus/hub-api'
import { CheckIcon, CircleIcon, LoaderIcon } from 'lucide-react'
import { TraceDescription, TraceIcon, TraceLine, TraceTitle } from '../../ui/trace.tsx'

type TasksPart = Extract<MessagePart, { type: 'tasks' }>
type Status = TasksPart['items'][number]['status']

const ICONS = { pending: CircleIcon, in_progress: LoaderIcon, completed: CheckIcon } as const
const SAID: Record<Status, string | undefined> = {
  pending: undefined,
  in_progress: 'em andamento',
  completed: 'concluída',
}

/**
 * The Builder's task list as it last wrote it, a line per task: the one in progress says what it
 * does, one at a time; a finished one is marked; no tasks, no list (card of step 14, U6).
 */
export function TaskList({ part }: { part: TasksPart }) {
  if (part.items.length === 0) return null
  return (
    <ul className="flex min-w-0 flex-col gap-xs">
      {part.items.map((item) => {
        const Icon = ICONS[item.status]
        const running = item.status === 'in_progress'
        return (
          <li key={item.id} className="min-w-0">
            <TraceLine status={running ? 'running' : undefined}>
              <TraceIcon>
                <Icon />
              </TraceIcon>
              <TraceTitle className="whitespace-normal">
                {running ? item.activeForm : item.content}
              </TraceTitle>
              {SAID[item.status] !== undefined && (
                <TraceDescription className="text-fact">{SAID[item.status]}</TraceDescription>
              )}
            </TraceLine>
          </li>
        )
      })}
    </ul>
  )
}
