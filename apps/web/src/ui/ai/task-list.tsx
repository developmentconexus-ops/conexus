import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { cn } from '../cn.ts'
import { Collapsible, CollapsibleTrigger } from '../collapsible.tsx'
import { Spinner } from '../spinner.tsx'

/** `text` is what the task says: its active form while it runs, when it has one. */
export type TaskView = { id: string; text: string; status: 'PENDING' | 'IN_PROGRESS' | 'DONE' }

export type TaskListText = {
  region: string
  heading: string
  done: string
  running: string
  pending: string
}

/** The task the folded list shows (Mastra's `TaskList`, its focused row). */
function focusedTask(tasks: readonly TaskView[]): TaskView | undefined {
  return (
    tasks.find((t) => t.status === 'IN_PROGRESS') ??
    tasks.find((t) => t.status === 'PENDING') ??
    tasks.at(-1)
  )
}

/**
 * The turn's tasks, on Mastra's `TaskList`: each status draws its icon and names it, the spinner on
 * the task running. Folded it shows the task in focus; it keeps its fold until it unmounts.
 */
export function TaskList(props: { tasks: readonly TaskView[]; text: TaskListText }): ReactElement {
  const { tasks, text } = props
  const [open, setOpen] = useState(false)
  const focused = focusedTask(tasks)
  const words = open ? 'break-words' : 'truncate'

  return (
    <Collapsible
      render={<section aria-label={text.region} />}
      open={open}
      onOpenChange={setOpen}
      className="flex min-w-0 flex-col gap-xs rounded-control border border-transparent bg-raised shadow-1 p-sm text-fact"
    >
      <CollapsibleTrigger className="flex w-fit cursor-pointer items-center gap-xs font-medium text-text-2">
        <ChevronRightIcon
          className={cn('size-3.5 transition-transform', open && 'rotate-90')}
          aria-hidden="true"
        />
        {text.heading}
      </CollapsibleTrigger>
      <ul className={cn('flex min-w-0 gap-sm', open ? 'flex-col' : 'items-center overflow-hidden')}>
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              'min-w-0 gap-xs',
              open ? 'items-start' : 'items-center',
              open || task.id === focused?.id
                ? 'flex flex-1 md:flex-none'
                : 'hidden md:flex md:shrink-0',
            )}
          >
            {task.status === 'DONE' && (
              <>
                <CheckIcon
                  className="size-3.5 shrink-0 text-success"
                  role="img"
                  aria-label={text.done}
                />
                <span className={cn(words, 'text-text-2')}>{task.text}</span>
              </>
            )}
            {task.status === 'IN_PROGRESS' && (
              <>
                <span className="flex shrink-0 text-accent">
                  <Spinner label={text.running} className="size-3.5" />
                </span>
                <span className={cn(words, 'font-medium text-text')}>{task.text}</span>
              </>
            )}
            {task.status === 'PENDING' && (
              <>
                <CircleIcon
                  className="size-3.5 shrink-0 text-text-2"
                  role="img"
                  aria-label={text.pending}
                />
                <span className={cn(words, 'text-text-2')}>{task.text}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </Collapsible>
  )
}
