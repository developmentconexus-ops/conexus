import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { assistantConversation, assistantScreens, COMPANY_ROOT, PEDIDOS_ID } from './test-hub.tsx'

// Conversas of a Projeto (step 24.1, criterion 23b and web W34).
const server = hubServer()
const { at } = assistantScreens(server)
const CONVERSAS = `${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant`

test('o dono vê a caixa, a barra do Projeto e só as conversas deste Projeto', async () => {
  const { conexus } = at(CONVERSAS, {
    conversations: [
      assistantConversation({ projectId: PEDIDOS_ID, title: 'Pedidos do mês' }),
      assistantConversation({ title: 'Conversa da empresa' }),
    ],
  })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })).toBeTruthy()
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy())
  expect(within(bar).queryByRole('combobox', { name: 'Projeto da conversa' })).toBeNull()
  const link = await screen.findByRole('link', { name: /Pedidos do mês/ })
  expect(screen.queryByText('Conversa da empresa')).toBeNull()
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
})

test('sem conversas, a página diz que nenhuma começou neste Projeto', async () => {
  at(CONVERSAS)
  expect(await screen.findByText('Nenhuma conversa neste Projeto ainda.')).toBeTruthy()
})

test('o membro lê quem pode conversar, e a página não esconde a regra', async () => {
  at(CONVERSAS, { role: 'member' })
  expect(
    await screen.findByText('Só o dono e os administradores conversam sobre o Projeto.'),
  ).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
})

test('a entrada Conversas fica na lateral do Projeto', async () => {
  at(CONVERSAS)
  expect(await screen.findByRole('link', { name: 'Conversas' })).toBeTruthy()
})
