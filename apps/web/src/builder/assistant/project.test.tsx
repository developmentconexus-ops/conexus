import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import {
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  PEDIDOS_ID,
  THIRD,
} from './test-hub.tsx'

// Conversas of a Projeto (step 24.1, criterion 23b and web W34).
const server = hubServer()
const { at } = assistantScreens(server)
const CONVERSAS = `${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant`

test('o dono vê a caixa, a barra do Projeto e só as conversas deste Projeto', async () => {
  const { conexus, asked } = at(CONVERSAS, {
    conversations: [
      assistantConversation({ projectId: PEDIDOS_ID, title: 'Pedidos do mês' }),
      assistantConversation({ id: ELSEWHERE, title: 'Conversa da empresa' }),
    ],
  })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeTruthy()
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy())
  expect(within(bar).queryByRole('combobox', { name: 'Projeto da conversa' })).toBeNull()
  expect(asked).toEqual([`?projectId=${PEDIDOS_ID}`])
  const link = await screen.findByRole('link', { name: /Pedidos do mês/ })
  expect(screen.queryByText('Conversa da empresa')).toBeNull()
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
})

test('a barra mostra o Projeto fixo ao lado de Ajustar, sem controle para trocá-lo', async () => {
  at(CONVERSAS)
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  expect(await within(bar).findByText(`Projeto · ${PEDIDOS.name}`)).toBeTruthy()
  expect(within(bar).getByRole('button', { name: 'Ajustar' })).toBeTruthy()
  expect(within(bar).queryByRole('combobox')).toBeNull()
})

test('a página do Projeto não oferece os exemplos do Início', async () => {
  at(CONVERSAS)
  await screen.findByRole('group', { name: 'Ligações da conversa' })
  expect(screen.queryByRole('list', { name: 'Exemplos' })).toBeNull()
})

test('sem conversas, a página diz que nenhuma começou neste Projeto', async () => {
  at(CONVERSAS)
  expect(await screen.findByText('Nenhuma conversa neste Projeto ainda.')).toBeTruthy()
})

test('sem ligação liberada ao Projeto, a barra diz onde liberar uma', async () => {
  at(CONVERSAS, { offered: [] })
  expect(await screen.findByText(/Este Projeto não recebeu nenhuma ligação\./)).toBeTruthy()
  expect(
    screen.getByRole('link', { name: 'Abrir Integrações do Projeto' }).getAttribute('href'),
  ).toBe(`${CONVERSAS.replace('/assistant', '')}/integrations`)
})

test('a lista passa de uma página: Ver mais leva à seguinte no endereço, e Primeira página volta', async () => {
  const { conexus } = at(CONVERSAS, {
    pageSize: 2,
    conversations: [
      assistantConversation({ id: ELSEWHERE, projectId: PEDIDOS_ID, title: 'Gama' }),
      assistantConversation({ id: THIRD, projectId: PEDIDOS_ID, title: 'Beta' }),
      assistantConversation({ projectId: PEDIDOS_ID, title: 'Alfa' }),
    ],
  })
  expect(await screen.findByRole('link', { name: /Gama/ })).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Alfa/ })).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Ver mais: Conversas' }))
  expect(await screen.findByRole('link', { name: /Alfa/ })).toBeTruthy()
  expect(conexus.router.state.location.search).toMatchObject({ page: '2' })
  fireEvent.click(screen.getByRole('link', { name: 'Primeira página: Conversas' }))
  expect(await screen.findByRole('link', { name: /Gama/ })).toBeTruthy()
})

test('o membro lê quem pode conversar, e a página não esconde a regra', async () => {
  at(CONVERSAS, { role: 'member' })
  expect(
    await screen.findByText('Só o dono e os administradores conversam sobre o Projeto.'),
  ).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeNull()
})

test('a entrada Conversas fica na lateral do Projeto', async () => {
  at(CONVERSAS)
  expect(await screen.findByRole('link', { name: 'Conversas' })).toBeTruthy()
})
