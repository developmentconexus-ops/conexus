import type { Task as HubTask } from '@conexus/hub-api'
import { CheckIcon, CircleIcon, PlayIcon } from 'lucide-react'
import type { z } from 'zod'
import { cn } from '../../ui/cn.ts'

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

  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  if (completed === total) return null
  const focused = focusedTask(tasks)

  return (
    <section
      aria-label="Painel de tarefas"
      className="flex min-w-0 flex-col gap-xs rounded-control border border-line bg-surface p-sm text-fact"
    >
      <div className="font-medium text-text-2">
        Tarefas · {completed} de {total}
      </div>
      <ul className="flex min-w-0 items-center gap-sm overflow-hidden">
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              'min-w-0 items-center gap-xs',
              task.id === focused?.id ? 'flex flex-1 md:flex-none' : 'hidden md:flex md:shrink-0',
            )}
          >
            {task.status === 'completed' && (
              <>
                <CheckIcon className="size-3.5 text-success" aria-hidden="true" />
                <span className="truncate text-text-2">{task.content}</span>
              </>
            )}
            {task.status === 'in_progress' && (
              <>
                <PlayIcon className="size-3.5 fill-current text-accent" aria-hidden="true" />
                <span className="truncate font-medium text-text">
                  {task.activeForm || task.content}
                </span>
              </>
            )}
            {task.status === 'pending' && (
              <>
                <CircleIcon className="size-3.5 text-text-2" aria-hidden="true" />
                <span className="truncate text-text-2">{task.content}</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
