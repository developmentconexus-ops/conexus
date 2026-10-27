import type { Task as HubTask } from '@conexus/hub-api'
import { CheckIcon, ChevronRightIcon, CircleIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import type { z } from 'zod'
import { cn } from '../../ui/cn.ts'
import { Collapsible, CollapsibleTrigger } from '../../ui/collapsible.tsx'

type Task = z.infer<typeof HubTask>

/** The task the folded list shows (Factory `focusedTaskIndex`, `task-list.tsx:176-182`). */
function focusedTask(tasks: readonly Task[]): Task | undefined {
  return (
    tasks.find((t) => t.status === 'in_progress') ??
    tasks.find((t) => t.status === 'pending') ??
    tasks.at(-1)
  )
}

/**
 * Pinned task panel above the composer while the turn runs (Criterion 10).
 * Disappears when all tasks are completed, or when the turn ends (#271).
 */
export function TaskPanel(props: { tasks: readonly Task[]; streaming: boolean }) {
  const { tasks, streaming } = props
  if (!streaming || tasks.length === 0) return null
  if (tasks.every((t) => t.status === 'completed')) return null
  return <OpenTasks tasks={tasks} />
}

/**
 * Each status draws its icon and names it, as Factory's `TaskList` does (Mastra 1.69 `task-list.tsx:67-71,92`):
 * the spinner for the task running is the founder's ask; Factory 1.78 draws rings instead.
 * Holds the fold: it unmounts with the panel, so the next turn's panel starts folded. */
function OpenTasks({ tasks }: { tasks: readonly Task[] }) {
  const [open, setOpen] = useState(false)
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const focused = focusedTask(tasks)
  const words = open ? 'break-words' : 'truncate'

  return (
    <Collapsible
      render={<section aria-label="Painel de tarefas" />}
      open={open}
      onOpenChange={setOpen}
      className="flex min-w-0 flex-col gap-xs rounded-control border border-line bg-surface p-sm text-fact"
    >
      <CollapsibleTrigger className="flex w-fit cursor-pointer items-center gap-xs font-medium text-text-2">
        <ChevronRightIcon
          className={cn('size-3.5 transition-transform', open && 'rotate-90')}
          aria-hidden="true"
        />
        Tarefas · {completed} de {total}
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
            {task.status === 'completed' && (
              <>
                <CheckIcon
                  className="size-3.5 shrink-0 text-success"
                  role="img"
                  aria-label="Concluída"
                />
                <span className={cn(words, 'text-text-2')}>{task.content}</span>
              </>
            )}
            {task.status === 'in_progress' && (
              <>
                <Loader2Icon
                  className="size-3.5 shrink-0 text-accent motion-safe:animate-spin"
                  role="img"
                  aria-label="Em andamento"
                />
                <span className={cn(words, 'font-medium text-text')}>
                  {task.activeForm || task.content}
                </span>
              </>
            )}
            {task.status === 'pending' && (
              <>
                <CircleIcon
                  className="size-3.5 shrink-0 text-text-2"
                  role="img"
                  aria-label="Pendente"
                />
                <span className={cn(words, 'text-text-2')}>{task.content}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </Collapsible>
  )
}
