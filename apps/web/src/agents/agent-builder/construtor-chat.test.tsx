import { CONSTRUTOR_CONTROLLER, CONVERSATION_ROUTES, CONVERSATION_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { SANKHYA, toolSaid } from '../assistant/test-hub.tsx'
import { AREA, BUILDER_CHAT } from '../saved-agent/test-agents.ts'
import { agentScreens } from '../saved-agent/test-hub.tsx'

// A conversation with the Construtor, at its own address (step 24.3, U5).
const server = hubServer()
const { at } = agentScreens(server)

test('uma conversa com o Construtor de outra pessoa dá não encontrado', async () => {
  at(`${AREA}/agent-builder/${BUILDER_CHAT}`, { agents: [], construtor: [] })
  expect(await screen.findByText('Esta conversa não existe mais.')).toBeTruthy()
})

test('na conversa, trocar o modelo manda a troca da sessão do Construtor e o botão mostra a escolha que o Hub aceitou', async () => {
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
  expect(put?.method).toBe('POST')
  expect(put?.path).toBe(
    `${CONVERSATION_ROUTES}/agent-controller/${CONSTRUTOR_CONTROLLER}/sessions/${BUILDER_CHAT}/model`,
  )
  expect(put?.body).toEqual({ modelId: 'anthropic/claude-opus-4', thinkingLevel: 'off' })
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

test('a conversa com o Construtor fica na folha branca, com o botão do modelo na caixa e sem o Projeto', async () => {
  at(`${AREA}/agent-builder/${BUILDER_CHAT}`, {
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
  const title = await screen.findByRole('heading', { level: 1, name: 'Meu agente' })
  const root = title.parentElement?.parentElement
  expect(root?.className).toContain('bg-surface')
  expect(root?.className).not.toContain('bg-canvas')
  const box = await screen.findByRole('textbox', { name: 'Mensagem para o Conexus' })
  const form = box.closest('form')
  if (form === null) throw new Error('the box has no form')
  expect(await within(form).findByRole('combobox', { name: 'Modelo e raciocínio' })).toBeTruthy()
  expect(within(form).queryByText(PEDIDOS.name)).toBeNull()
})

test('a conversa do Construtor lê "Leu Sankhya · Matriz" (F-A2, step 24.3)', async () => {
  const updated = '2026-11-02T12:00:00.000Z'
  at(`${AREA}/agent-builder/${BUILDER_CHAT}`, {
    agents: [],
    construtor: [{ id: BUILDER_CHAT, title: 'x', createdAt: updated, updatedAt: updated }],
  })
  const read = { operation: 'sankhya.consultar', connection: 'Matriz' }
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: false }),
    ),
    http.get(
      `*${CONVERSATION_ROUTES}/agent-controller/${CONSTRUTOR_CONTROLLER}/sessions/:id/threads/:t/messages`,
      () =>
        HttpResponse.json({
          messages: [
            toolSaid(CONVERSATION_TOOL.connectorRead, read, {
              kind: 'OK',
              value: {},
              complete: true,
            }),
          ],
        }),
    ),
  )
  expect(await screen.findByText('Leu Sankhya · Matriz')).toBeTruthy()
})
