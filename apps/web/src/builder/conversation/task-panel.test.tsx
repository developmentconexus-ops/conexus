import type { Task as HubTask } from '@conexus/hub-api'
import { MessageId } from '@conexus/hub-api'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { z } from 'zod'
import { hubServer } from '../../platform/test-hub.tsx'
import { TaskPanel } from './task-panel.tsx'
import { conversationOf, FIRST, screens } from './test-hub.tsx'

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

  const { lines } = await openConversation(conversation)
  // Initially not streaming, so task panel is hidden
  expect(screen.queryByRole('region', { name: 'Painel de tarefas' })).toBeNull()

  // Line starts a turn: task panel reads tasks from conversation.tasks
  lines[0]?.emit({
    type: 'turn',
    messages: [
      {
        id: MessageId.parse('builder-turn-1'),
        role: 'builder',
        parts: [],
        suspended: {},
        model: conversation.model,
        createdAt: new Date().toISOString(),
      },
    ],
    startedAt: new Date().toISOString(),
  })

  expect(await screen.findByRole('region', { name: 'Painel de tarefas' })).toBeTruthy()
  expect(screen.getByText('Tarefas · 1 de 3')).toBeTruthy()
  expect(screen.getByText('Fazendo a tela de pedidos')).toBeTruthy()
})
