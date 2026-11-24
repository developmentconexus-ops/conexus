import type { Task as HubTask } from '@conexus/hub-api'
import type { z } from 'zod'
import type { TaskView } from '../../ui/ai/task-list.tsx'
import { TaskList } from '../../ui/ai/task-list.tsx'

type Task = z.infer<typeof HubTask>

const STATUS = { pending: 'PENDING', in_progress: 'IN_PROGRESS', completed: 'DONE' } as const

function viewOf(task: Task): TaskView {
  const status = STATUS[task.status]
  return {
    id: task.id,
    text: status === 'IN_PROGRESS' ? task.activeForm || task.content : task.content,
    status,
  }
}

/**
 * Pinned task panel above the composer while the turn runs (Criterion 10).
 * Disappears when all tasks are completed, or when the turn ends (#271); it unmounts then, so the next
 * turn's panel starts folded.
 */
export function TaskPanel(props: { tasks: readonly Task[]; streaming: boolean }) {
  const { tasks, streaming } = props
  if (!streaming || tasks.length === 0) return null
  if (tasks.every((t) => t.status === 'completed')) return null
  const completed = tasks.filter((t) => t.status === 'completed').length
  return (
    <TaskList
      tasks={tasks.map(viewOf)}
      text={{
        region: 'Painel de tarefas',
        heading: `Tarefas · ${completed} de ${tasks.length}`,
        done: 'Concluída',
        running: 'Em andamento',
        pending: 'Pendente',
      }}
    />
  )
}
