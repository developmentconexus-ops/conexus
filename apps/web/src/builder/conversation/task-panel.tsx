import type { Task as HubTask } from '@conexus/hub-api'
import { CheckIcon, CircleIcon, PlayIcon } from 'lucide-react'
import type { z } from 'zod'

type Task = z.infer<typeof HubTask>

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

  return (
    <section
      aria-label="Painel de tarefas"
      className="flex min-w-0 flex-col gap-xs rounded-control border border-line bg-surface p-sm text-fact"
    >
      <div className="font-medium text-text-2">
        Tarefas · {completed} de {total}
      </div>
      <ul className="flex min-w-0 flex-wrap items-center gap-sm overflow-x-auto">
        {tasks.map((task) => (
          <li key={task.id} className="flex min-w-0 shrink-0 items-center gap-xs">
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
