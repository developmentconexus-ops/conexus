import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import {
  ASKED,
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

test('o dono vê a caixa, a pasta do Projeto e só as conversas deste Projeto', async () => {
  const { conexus, asked } = at(CONVERSAS, {
    conversations: [
      assistantConversation({ projectId: PEDIDOS_ID, title: 'Pedidos do mês' }),
      assistantConversation({ id: ELSEWHERE, title: 'Conversa da empresa' }),
    ],
  })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeTruthy()
  await screen.findByRole('button', { name: '2 ferramentas' })
  expect(screen.queryByRole('button', { name: 'Projeto da conversa' })).toBeNull()
  expect(asked).toEqual([`?projectId=${PEDIDOS_ID}`])
  const link = await screen.findByRole('link', { name: /Pedidos do mês/ })
  expect(screen.queryByText('Conversa da empresa')).toBeNull()
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
})

test('a lista do Projeto leva o nome Conversas só como região: o título da página é o único título (U4)', async () => {
  at(CONVERSAS, { conversations: [assistantConversation({ projectId: PEDIDOS_ID })] })
  await screen.findByRole('link', { name: /Vendas da semana/ })
  expect(screen.getAllByRole('heading', { name: 'Conversas' })).toHaveLength(1)
  expect(screen.getByRole('region', { name: 'Conversas' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Conversas recentes' })).toBeNull()
})

test('a pasta mostra o nome do Projeto, sem controle para trocá-lo, e a contagem vem depois dele', async () => {
  at(CONVERSAS)
  const tools = await screen.findByRole('button', { name: '2 ferramentas' })
  const name = await within(tools.parentElement ?? document.body).findByText(PEDIDOS.name)
  expect(name.compareDocumentPosition(tools) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Projeto da conversa' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Ajustar' })).toBeNull()
})

test('na conversa de um Projeto, se a leitura do Projeto falha, a pasta diz "Projeto" em vez de ficar sem nome', async () => {
  at(`${CONVERSAS}/${ASKED}`, {
    conversations: [assistantConversation({ projectId: PEDIDOS_ID })],
  })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects/:projectId`, () =>
      refusal('DATABASE_UNAVAILABLE'),
    ),
  )
  const tools = await screen.findByRole('button', { name: '2 ferramentas' })
  expect(await within(tools.parentElement ?? document.body).findByText('Projeto')).toBeTruthy()
})

test('a página do Projeto não oferece os exemplos do Início', async () => {
  at(CONVERSAS)
  await screen.findByRole('button', { name: '2 ferramentas' })
  expect(screen.queryByRole('list', { name: 'Exemplos' })).toBeNull()
})

test('sem conversas, a página diz que nenhuma começou neste Projeto', async () => {
  at(CONVERSAS)
  expect(await screen.findByText('Nenhuma conversa neste Projeto ainda.')).toBeTruthy()
})

test('sem ligação liberada ao Projeto, a contagem diz "Sem ferramentas" e o menu leva às Integrações do Projeto', async () => {
  at(CONVERSAS, { offered: [] })
  fireEvent.click(await screen.findByRole('button', { name: 'Sem ferramentas' }))
  expect(await screen.findByText('Liberar um sistema em Integrações do Projeto')).toBeTruthy()
  const link = screen.getByRole('link', { name: 'Liberar outra ferramenta ao Projeto' })
  expect(link.getAttribute('href')).toBe(`${CONVERSAS.replace('/assistant', '')}/integrations`)
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

test('o membro conversa no Projeto: a caixa do Assistente está na página, sem frase que o impeça', async () => {
  at(CONVERSAS, { role: 'member' })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeTruthy()
  expect(screen.queryByText(/conversam sobre o Projeto/)).toBeNull()
})

test('a entrada Conversas fica na lateral do Projeto', async () => {
  at(CONVERSAS)
  expect(await screen.findByRole('link', { name: 'Conversas' })).toBeTruthy()
})

test('enquanto a lista lê, a página mostra o esqueleto no lugar dela, com a caixa já à mostra', async () => {
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  at(CONVERSAS, {
    conversations: [assistantConversation({ projectId: PEDIDOS_ID })],
    answers: {
      list: async () => {
        await held
        return undefined
      },
    },
  })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Vendas da semana/ })).toBeNull()
  release()
  expect(await screen.findByRole('link', { name: /Vendas da semana/ })).toBeTruthy()
})

test('se a lista falha, a página diz a frase da falha e Tentar de novo lê outra vez', async () => {
  let failing = true
  at(CONVERSAS, {
    conversations: [assistantConversation({ projectId: PEDIDOS_ID })],
    answers: { list: () => (failing ? refusal('DATABASE_UNAVAILABLE') : undefined) },
  })
  expect(await screen.findByText(/O banco do Conexus não respondeu\./)).toBeTruthy()
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('link', { name: /Vendas da semana/ })).toBeTruthy()
})

test('um Projeto que o Hub não acha mais (apagado) diz a frase de não encontrado', async () => {
  at(CONVERSAS, { answers: { list: () => refusal('NOT_FOUND') } })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Vendas da semana/ })).toBeNull()
})
