import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, BUILDER_CHAT, CHAT, TEST_CHAT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// Criterion 26 of "Uma sala e os nomes certos" (U13): Renomear in the Testar panel and in the
// Construtor de agentes' list.
const { at } = agentScreens(hubServer())

const CONVERSATIONS = [
  {
    id: CHAT,
    agentId: AGENT,
    draft: false,
    title: 'Metas de ontem',
    createdAt: '2026-11-02T12:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
  },
  {
    id: TEST_CHAT,
    agentId: AGENT,
    draft: true,
    title: 'Rascunho de teste',
    createdAt: '2026-11-02T12:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
  },
]

test('no Testar, o ⋮ ao lado da lista renomeia a conversa aberta sem levar o " · Teste" ao título', async () => {
  const { writes } = at(`${AREA}/${AGENT}/${TEST_CHAT}`, {
    agents: [agent()],
    conversations: CONVERSATIONS,
  })
  const panel = await screen.findByRole('region', { name: 'Testar' })
  fireEvent.click(
    await within(panel).findByRole('button', {
      name: 'Ações da conversa: Rascunho de teste',
    }),
  )
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
  const field = await screen.findByLabelText('Título da conversa')
  expect(field).toHaveProperty('value', 'Rascunho de teste')
  fireEvent.change(field, { target: { value: 'Teste das metas' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(within(panel).getByRole('combobox', { name: 'Conversas' })).toHaveProperty(
      'value',
      'Teste das metas · Teste',
    ),
  )
  const puts = writes().filter((one) => one.method === 'PUT')
  expect(puts.map((one) => one.body)).toEqual([{ title: 'Teste das metas' }])
  expect(puts[0]?.path).toMatch(
    new RegExp(`/agent-controller/[^/]+/sessions/${TEST_CHAT}/threads/${TEST_CHAT}$`),
  )
})

test('no Construtor de agentes, cada linha tem o ⋮ com Renomear, e a linha mostra o título novo', async () => {
  const { writes } = at(AREA, {
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
  fireEvent.click(
    await screen.findByRole('button', { name: 'Ações da conversa: Agente de vendas' }),
  )
  expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull()
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
  fireEvent.change(await screen.findByLabelText('Título da conversa'), {
    target: { value: 'Agente de cobrança' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByRole('link', { name: /^Agente de cobrança/ })).toBeTruthy()
  expect(
    writes()
      .filter((one) => one.method === 'PUT')
      .map((one) => one.body),
  ).toEqual([{ title: 'Agente de cobrança' }])
})
