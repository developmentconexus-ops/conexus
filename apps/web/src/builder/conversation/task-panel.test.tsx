import type { Task as HubTask } from '@conexus/hub-api'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { z } from 'zod'
import { hubServer } from '../../platform/test-hub.tsx'
import { TaskPanel } from './task-panel.tsx'
import { AGENT_START } from './test-events.ts'
import { conversationOf, FIRST, screens } from './test-hub.tsx'
import { recordedEvent, TaskUpdated } from './test-recorded.ts'

type Task = z.infer<typeof HubTask>

const { openConversation } = screens(hubServer())

const TASKS: Task[] = [
  { id: '1', content: 'Montar a tabela', activeForm: 'Montando a tabela', status: 'completed' },
  {
    id: '2',
    content: 'Fazer a tela de pedidos',
    activeForm: 'Fazendo a tela de pedidos',
    status: 'in_progress',
  },
  { id: '3', content: 'Conferir o app', activeForm: 'Conferindo o app', status: 'pending' },
]

test('painel "Tarefas · N de M" enquanto o turno roda com tarefas abertas (Critério 10)', () => {
  render(<TaskPanel tasks={TASKS} streaming={true} />)
  expect(screen.getByRole('region', { name: 'Painel de tarefas' })).toBeTruthy()
  expect(screen.getByText('Tarefas · 1 de 3')).toBeTruthy()
  expect(screen.getByText('Montar a tabela')).toBeTruthy()
  expect(screen.getByText('Fazendo a tela de pedidos')).toBeTruthy()
  expect(screen.getByText('Conferir o app')).toBeTruthy()
})

test('some quando todas as tarefas estão concluídas (Critério 10)', () => {
  const allCompleted: Task[] = [
    { id: '1', content: 'Montar a tabela', activeForm: 'Montando', status: 'completed' },
    { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo', status: 'completed' },
  ]
  render(<TaskPanel tasks={allCompleted} streaming={true} />)
  expect(screen.queryByRole('region', { name: 'Painel de tarefas' })).toBeNull()
  expect(screen.queryByText(/Tarefas ·/)).toBeNull()
})

test('some quando o turno termina, sem nenhum "em andamento" girando (#271, Critério 10)', () => {
  const { rerender } = render(<TaskPanel tasks={TASKS} streaming={true} />)
  expect(screen.getByText('Tarefas · 1 de 3')).toBeTruthy()

  // Turn ends (streaming becomes false): panel must disappear completely
  rerender(<TaskPanel tasks={TASKS} streaming={false} />)
  expect(screen.queryByRole('region', { name: 'Painel de tarefas' })).toBeNull()
  expect(screen.queryByText(/Tarefas ·/)).toBeNull()
  expect(screen.queryByText(/Fazendo a tela/)).toBeNull()
})

test('some sem tarefas (Critério 10, matriz de estados)', () => {
  render(<TaskPanel tasks={[]} streaming={true} />)
  expect(screen.queryByRole('region', { name: 'Painel de tarefas' })).toBeNull()
})

test('ao recarregar, as tarefas são lidas de Conversation.tasks (Critério 10)', async () => {
  const conversation = conversationOf({
    id: FIRST,
    tasks: TASKS,
  })

  const { line } = await openConversation(conversation)
  // Initially not streaming, so task panel is hidden
  expect(screen.queryByRole('region', { name: 'Painel de tarefas' })).toBeNull()

  // A run starts before Mastra's display state names tasks: the panel reads conversation.tasks.
  line().emit(AGENT_START)

  expect(await screen.findByRole('region', { name: 'Painel de tarefas' })).toBeTruthy()
  expect(screen.getByText('Tarefas · 1 de 3')).toBeTruthy()
  expect(screen.getByText('Fazendo a tela de pedidos')).toBeTruthy()
})

function visible(rendered: HTMLElement) {
  return [...rendered.querySelectorAll('li')]
    .filter((li) => !li.classList.contains('hidden'))
    .map((li) => li.textContent)
}

test('a 390 px só a tarefa em andamento fica visível; sem nenhuma, a primeira pendente (Critério 10)', () => {
  const working = render(<TaskPanel tasks={TASKS} streaming={true} />)
  expect(visible(working.container)).toEqual(['Fazendo a tela de pedidos'])
  expect(
    [...working.container.querySelectorAll('li.hidden')].every((li) =>
      li.classList.contains('md:flex'),
    ),
  ).toBe(true)
  working.unmount()

  const waiting = render(
    <TaskPanel
      tasks={[
        {
          id: '1',
          content: 'Montar a tabela',
          activeForm: 'Montando a tabela',
          status: 'completed',
        },
        { id: '3', content: 'Conferir o app', activeForm: 'Conferindo o app', status: 'pending' },
        { id: '4', content: 'Publicar', activeForm: 'Publicando', status: 'pending' },
      ]}
      streaming={true}
    />,
  )
  expect(visible(waiting.container)).toEqual(['Conferir o app'])
})

test('toque no painel abre a lista inteira e outro toque a dobra (Critério 10)', () => {
  render(<TaskPanel tasks={TASKS} streaming={true} />)
  const toggle = screen.getByRole('button', { name: /Tarefas · 1 de 3/ })
  function hidden() {
    return screen
      .getAllByRole('listitem')
      .filter((item) => item.className.split(' ').includes('hidden'))
  }
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(hidden()).toHaveLength(2)
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(hidden()).toHaveLength(0)
  fireEvent.click(toggle)
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(hidden()).toHaveLength(2)
})

test('o painel aberto dobra quando o turno termina e volta dobrado no seguinte (Critério 10)', () => {
  const view = render(<TaskPanel tasks={TASKS} streaming={true} />)
  fireEvent.click(screen.getByRole('button', { name: /Tarefas · 1 de 3/ }))
  view.rerender(<TaskPanel tasks={TASKS} streaming={false} />)
  view.rerender(<TaskPanel tasks={TASKS} streaming={true} />)
  expect(
    screen.getByRole('button', { name: /Tarefas · 1 de 3/ }).getAttribute('aria-expanded'),
  ).toBe('false')
})

test('depois de a stream cair no meio da execução, o painel mostra as tarefas de agora, lidas do estado da sessão (Critério 10)', async () => {
  const conversation = conversationOf({
    id: FIRST,
    tasks: [
      { id: '1', content: 'Montar a tabela', activeForm: 'Montando', status: 'in_progress' },
      { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo', status: 'pending' },
      { id: '3', content: 'Conferir o app', activeForm: 'Conferindo', status: 'pending' },
    ],
  })
  const { line } = await openConversation(conversation)
  line().emit(AGENT_START)
  expect(await screen.findByText('Tarefas · 0 de 3')).toBeTruthy()

  // The run goes on while the phone's stream is down: its task events are gone for good.
  conversation.tasks = [
    { id: '1', content: 'Montar a tabela', activeForm: 'Montando', status: 'completed' },
    { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo', status: 'completed' },
    { id: '3', content: 'Conferir o app', activeForm: 'Conferindo', status: 'in_progress' },
  ]
  const first = line()
  first.close()
  await waitFor(() => expect(line()).not.toBe(first))
  line().emit(AGENT_START)

  expect(await screen.findByText('Tarefas · 2 de 3')).toBeTruthy()
})

test('cada atualização de tarefas que o Mastra envia avança a contagem do painel, uma de cada vez (Critério 10)', async () => {
  const { line } = await openConversation(conversationOf({ id: FIRST }))
  line().emit(AGENT_START)
  for (const done of [0, 1, 2]) {
    line().emit(
      recordedEvent(
        'tasks',
        TaskUpdated,
        (event) => event.tasks.filter((task) => task.status === 'completed').length === done,
      ),
    )
    expect(await screen.findByText(`Tarefas · ${done} de 3`)).toBeTruthy()
  }
})

test('cada situação de tarefa tem o nome no ícone, para o leitor de tela (Critério 10)', () => {
  render(<TaskPanel tasks={TASKS} streaming={true} />)
  expect(screen.getByRole('img', { name: 'Concluída' })).toBeTruthy()
  expect(screen.getByRole('img', { name: 'Em andamento' })).toBeTruthy()
  expect(screen.getByRole('img', { name: 'Pendente' })).toBeTruthy()
})
