import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { say } from '../../harness/room/test-hub.tsx'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { AREA, BUILDER_CHAT } from '../saved-agent/test-agents.ts'
import { agentScreens } from '../saved-agent/test-hub.tsx'

// The Construtor's box and earlier conversations on a Projeto's Agentes (step 24.3, U5, criteria 26 and 28).
const { at } = agentScreens(hubServer())

test('mandar o primeiro pedido abre uma conversa com o Construtor e leva a ela', async () => {
  const { conexus, writes } = at(AREA, { agents: [] })
  say(
    await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' }),
    'quero um agente de vendas',
  )
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${AREA}/agent-builder/${BUILDER_CHAT}`),
  )
  expect(writes()[0]?.path).toMatch(/construtor\/conversations$/)
  expect(writes()[0]?.body).toMatchObject({ model: 'anthropic/claude-sonnet-4' })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })).toBeTruthy()
})

test('as conversas anteriores com o Construtor aparecem em lista', async () => {
  at(AREA, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: 'Agente de vendas',
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const link = await screen.findByRole('link', { name: /^Agente de vendas/ })
  expect(link.getAttribute('href')).toBe(`${AREA}/agent-builder/${BUILDER_CHAT}`)
})

test('uma conversa com o Construtor sem título leva o dia e a hora em que começou, não os da última mudança', async () => {
  at(AREA, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: null,
        createdAt: '2026-11-01T15:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const link = await screen.findByRole('link', { name: /^Conversa de 01\/11\/2026, 12:00/ })
  expect(link.getAttribute('href')).toBe(`${AREA}/agent-builder/${BUILDER_CHAT}`)
})

test('abrir a conversa com o Construtor sem conta para o modelo diz a frase com o caminho das contas', async () => {
  at(AREA, { agents: [], answers: { openConstrutor: () => refusal('MODEL_NO_ACCOUNT') } })
  say(
    await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' }),
    'quero um agente de vendas',
  )
  expect(
    await screen.findByText(
      'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Minhas contas de modelo' })).toBeTruthy()
})

test('o modelo escolhido na caixa vai com o pedido que abre a conversa', async () => {
  const { writes } = at(AREA, { agents: [] })
  fireEvent.click(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Claude Opus 4' }))
  say(await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' }), 'um pedido')
  await waitFor(() => expect(writes()[0]?.body).toMatchObject({ model: 'anthropic/claude-opus-4' }))
})
