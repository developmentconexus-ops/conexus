import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { AREA, BUILDER_CHAT } from '../saved-agent/test-agents.ts'
import { agentScreens } from '../saved-agent/test-hub.tsx'

// A conversation with the Construtor, at its own address (step 24.3, U5).
const server = hubServer()
const { at } = agentScreens(server)

test('uma conversa com o Construtor de outra pessoa dá não encontrado', async () => {
  at(`${AREA}/agent-builder/${BUILDER_CHAT}`, { agents: [], construtor: [] })
  expect(await screen.findByText('Esta conversa não existe mais.')).toBeTruthy()
})

test('na conversa, trocar o modelo manda o PUT do Construtor e o botão mostra o que o Hub guardou', async () => {
  const { writes } = at(`${AREA}/agent-builder/${BUILDER_CHAT}`, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: 'Meu agente',
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  fireEvent.click(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Claude Opus 4' }))
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
      /Opus/,
    ),
  )
  const [put] = writes()
  expect(put?.method).toBe('PUT')
  expect(put?.path).toMatch(new RegExp(`/construtor/conversations/${BUILDER_CHAT}/model$`))
  expect(put?.body).toMatchObject({ model: 'anthropic/claude-opus-4' })
})

test('a conversa com o Construtor sumir do Hub faz a lista ser lida de novo', async () => {
  const row = {
    id: BUILDER_CHAT,
    title: 'Meu agente',
    createdAt: '2026-11-02T11:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
  }
  let reads = 0
  let atGone = Number.POSITIVE_INFINITY
  at(`${AREA}/agent-builder/${BUILDER_CHAT}`, { agents: [], construtor: [row] })
  server.use(
    http.get('*/construtor/conversations', () => {
      reads += 1
      return HttpResponse.json({ conversations: [row] })
    }),
    http.get('*/stream', async () => {
      await vi.waitFor(() => expect(reads).toBeGreaterThan(0))
      atGone = reads
      return refusal('CONVERSATION_NOT_FOUND')
    }),
  )
  await waitFor(() => expect(reads).toBeGreaterThan(atGone))
})
