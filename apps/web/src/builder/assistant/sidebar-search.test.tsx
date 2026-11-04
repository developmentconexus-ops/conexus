import { CONVERSATION_SEARCH_MAX, ConversationId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  PEDIDOS_ID,
  THIRD,
} from './test-hub.tsx'

// The list's search, place filter and Projetos tab (step 24.3.3, U2), in the company's drawer list.
const server = hubServer()
const { at } = assistantScreens(server)

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-02T18:00:00Z') }))
afterEach(() => vi.useRealTimers())

async function list() {
  const nav = await screen.findByRole('navigation', { name: 'Navegação' })
  const column = nav.querySelector<HTMLElement>('[data-sidebar="sidebar"]')
  if (column === null) throw new Error('the sidebar has no list')
  return within(column)
}

const TWO = [
  assistantConversation({ title: 'De hoje', updatedAt: '2026-11-02T16:00:00Z' }),
  assistantConversation({ id: ELSEWHERE, title: 'De ontem', updatedAt: '2026-11-02T01:00:00Z' }),
]

test('a busca: digitar parte do título, sem acento nem caixa, deixa só essas, no endereço; sem nenhuma, a frase; o endereço reabre a mesma lista', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({ title: 'Relatório de Outubro', updatedAt: '2026-11-02T17:00:00Z' }),
      assistantConversation({
        id: ELSEWHERE,
        title: 'Estoque parado',
        updatedAt: '2026-11-02T16:00:00Z',
      }),
    ],
  })
  const nav = await list()
  fireEvent.click(await nav.findByRole('button', { name: 'Buscar conversa' }))
  const box = await nav.findByRole('searchbox', { name: 'Buscar pelo título' })
  fireEvent.change(box, { target: { value: 'RELATORIO' } })
  expect(await nav.findByRole('link', { name: /Relatório de Outubro/ })).toBeTruthy()
  await waitFor(() => expect(nav.queryByRole('link', { name: /Estoque parado/ })).toBeNull())
  expect(conexus.router.state.location.search).toMatchObject({ q: 'RELATORIO' })
  fireEvent.change(box, { target: { value: 'nada disso' } })
  expect(await nav.findByText('Nenhuma conversa com esse nome.')).toBeTruthy()
})

test('o lugar: o filtro mostra só as daquele lugar com um rótulo e ×, e o × tira o filtro do endereço (10)', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({ title: 'Da casa', updatedAt: '2026-11-02T17:00:00Z' }),
      assistantConversation({
        id: THIRD,
        title: 'Do Projeto',
        updatedAt: '2026-11-02T16:00:00Z',
        projectId: PEDIDOS_ID,
      }),
    ],
  })
  const nav = await list()
  fireEvent.click(await nav.findByRole('button', { name: 'Filtrar conversas' }))
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Início' }))
  await waitFor(() => expect(nav.queryByRole('link', { name: /Do Projeto/ })).toBeNull())
  expect(await nav.findByRole('link', { name: /Da casa/ })).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
  expect(conexus.router.state.location.search).toMatchObject({ place: 'HOME' })
  fireEvent.click(nav.getByRole('button', { name: 'Tirar o filtro: Início' }))
  expect(await nav.findByRole('link', { name: /Do Projeto/ })).toBeTruthy()
  expect(conexus.router.state.location.search).not.toHaveProperty('place')
})

test('a aba Projetos: um grupo por Projeto com as conversas dele e Sem Projeto no fim (11)', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({ title: 'Da casa', updatedAt: '2026-11-02T17:00:00Z' }),
      assistantConversation({
        id: THIRD,
        title: 'Do Projeto',
        updatedAt: '2026-11-02T16:00:00Z',
        projectId: PEDIDOS_ID,
      }),
    ],
  })
  const nav = await list()
  fireEvent.click(await nav.findByRole('tab', { name: 'Projetos' }))
  expect(conexus.router.state.location.search).toMatchObject({ tab: 'projects' })
  const project = await nav.findByRole('button', { name: /Pedidos/ })
  const without = await nav.findByRole('button', { name: /Sem Projeto/ })
  expect(project.compareDocumentPosition(without) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const row = await nav.findByRole('link', { name: /Do Projeto/ })
  expect(row.textContent).not.toContain('Pedidos')
  expect(await nav.findByRole('link', { name: /Da casa/ })).toBeTruthy()
})

test('a aba Projetos mostra até 5 conversas de um Projeto, e Ver todas leva a place=<Projeto> na aba Recentes (11)', async () => {
  const six = Array.from({ length: 6 }, (_, index) =>
    assistantConversation({
      id: ConversationId.parse(`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0${index}`),
      title: `Pedido ${index}`,
      updatedAt: `2026-11-02T1${index}:00:00Z`,
      projectId: PEDIDOS_ID,
    }),
  )
  const { conexus } = at(COMPANY_ROOT, { conversations: six })
  const nav = await list()
  fireEvent.click(await nav.findByRole('tab', { name: 'Projetos' }))
  await nav.findByRole('button', { name: /Sem Projeto/ })
  await waitFor(() => expect(nav.getAllByRole('link', { name: /Pedido \d/ })).toHaveLength(5))
  expect(nav.getAllByRole('link', { name: /Pedido \d/ })).toHaveLength(5)
  fireEvent.click(nav.getByRole('link', { name: 'Ver todas' }))
  await waitFor(() =>
    expect(conexus.router.state.location.search).toMatchObject({ place: PEDIDOS_ID }),
  )
  expect(conexus.router.state.location.search).not.toHaveProperty('tab')
  expect(await nav.findByRole('tab', { name: 'Recentes', selected: true })).toBeTruthy()
})

test('uma busca que o Hub recusaria (só espaços, ou mais de 100 caracteres) não vira erro: a lista segue inteira', async () => {
  for (const q of ['%20%20%20', 'a'.repeat(101)]) {
    const { conexus } = at(`${COMPANY_ROOT}?q=${q}`, { conversations: TWO })
    const nav = await list()
    expect(await nav.findByRole('link', { name: /De hoje/ })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(nav.queryByText('Nenhuma conversa com esse nome.')).toBeNull()
    await conexus.router.navigate({ to: '/' })
  }
})

test('o campo da busca limita o texto ao do contrato e não deixa o ✕ do navegador', async () => {
  at(COMPANY_ROOT, { conversations: TWO })
  const nav = await list()
  fireEvent.click(await nav.findByRole('button', { name: 'Buscar conversa' }))
  const box = await nav.findByRole('searchbox', { name: 'Buscar pelo título' })
  expect(box.getAttribute('maxlength')).toBe(String(CONVERSATION_SEARCH_MAX))
})

test('a lupa leva o foco ao campo; o endereço com o texto abre o campo sem tirar o foco da página', async () => {
  at(`${COMPANY_ROOT}?q=hoje`, { conversations: TWO })
  const nav = await list()
  const box = await nav.findByRole('searchbox', { name: 'Buscar pelo título' })
  expect(document.activeElement).not.toBe(box)
  fireEvent.click(nav.getByRole('button', { name: 'Buscar conversa' }))
  fireEvent.click(nav.getByRole('button', { name: 'Buscar conversa' }))
  expect(document.activeElement).toBe(
    await nav.findByRole('searchbox', { name: 'Buscar pelo título' }),
  )
})

test('fechar a lupa tira o texto do endereço e a lista volta inteira', async () => {
  const { conexus } = at(`${COMPANY_ROOT}?q=hoje`, { conversations: TWO })
  const nav = await list()
  expect(await nav.findByRole('searchbox', { name: 'Buscar pelo título' })).toBeTruthy()
  await waitFor(() => expect(nav.queryByRole('link', { name: /ontem/ })).toBeNull())
  fireEvent.click(nav.getByRole('button', { name: 'Buscar conversa' }))
  expect(await nav.findByRole('link', { name: /ontem/ })).toBeTruthy()
  expect(nav.queryByRole('searchbox')).toBeNull()
  expect(conexus.router.state.location.search).not.toHaveProperty('q')
})

test('digitar na busca mantém a lista à vista até a resposta chegar, sem esqueleto a cada letra', async () => {
  at(COMPANY_ROOT, { conversations: TWO })
  const nav = await list()
  fireEvent.click(await nav.findByRole('button', { name: 'Buscar conversa' }))
  await nav.findByRole('link', { name: /De hoje/ })
  let most = 0
  const watch = new MutationObserver(() => {
    most = Math.max(
      most,
      document.querySelectorAll('[data-sidebar="sidebar"] [data-slot="sidebar-menu-skeleton"]')
        .length,
    )
  })
  watch.observe(document.body, { childList: true, subtree: true })
  const box = nav.getByRole('searchbox', { name: 'Buscar pelo título' })
  for (const text of ['d', 'de', 'de h']) fireEvent.change(box, { target: { value: text } })
  await waitFor(() => expect(nav.queryByRole('link', { name: /ontem/ })).toBeNull())
  watch.disconnect()
  expect(most).toBe(0)
})

test('trocar de lugar com a resposta a caminho mostra os esqueletos, nunca a lista do lugar anterior', async () => {
  const answer = Promise.withResolvers<undefined>()
  let held: Promise<undefined> | undefined
  at(COMPANY_ROOT, { conversations: TWO, answers: { list: () => held } })
  const nav = await list()
  await nav.findByRole('link', { name: /De hoje/ })
  held = answer.promise
  fireEvent.click(await nav.findByRole('button', { name: 'Filtrar conversas' }))
  fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Início' }))
  await waitFor(() =>
    expect(
      document.querySelectorAll('[data-sidebar="sidebar"] [data-slot="sidebar-menu-skeleton"]'),
    ).toHaveLength(3),
  )
  expect(nav.queryByRole('link', { name: /De hoje/ })).toBeNull()
  answer.resolve(undefined)
  expect(await nav.findByRole('link', { name: /De hoje/ })).toBeTruthy()
})

test('na aba Projetos a busca vale dentro de cada grupo, e o chip de lugar sai; um grupo sem achado diz a frase da busca', async () => {
  at(`${COMPANY_ROOT}?q=relatorio&place=HOME&tab=projects`, {
    conversations: [
      assistantConversation({ title: 'Relatório da casa', updatedAt: '2026-11-02T17:00:00Z' }),
      assistantConversation({
        id: ELSEWHERE,
        title: 'Estoque da casa',
        updatedAt: '2026-11-02T16:00:00Z',
      }),
      assistantConversation({
        id: THIRD,
        title: 'Estoque do Projeto',
        updatedAt: '2026-11-02T15:00:00Z',
        projectId: PEDIDOS_ID,
      }),
    ],
  })
  const nav = await list()
  expect(await nav.findByRole('link', { name: /Relatório da casa/ })).toBeTruthy()
  expect(nav.queryByRole('link', { name: /Estoque/ })).toBeNull()
  expect(await nav.findByText('Nenhuma conversa com esse nome.')).toBeTruthy()
  expect(nav.queryByText('Nenhuma conversa neste Projeto ainda.')).toBeNull()
  expect(nav.queryByRole('button', { name: 'Filtrar conversas' })).toBeNull()
  expect(nav.queryByRole('button', { name: /Tirar o filtro/ })).toBeNull()
  expect(nav.getByRole('searchbox', { name: 'Buscar pelo título' })).toBeTruthy()
  fireEvent.click(nav.getByRole('tab', { name: 'Recentes' }))
  expect(await nav.findByRole('button', { name: 'Tirar o filtro: Início' })).toBeTruthy()
  expect(await nav.findByRole('link', { name: /Relatório da casa/ })).toBeTruthy()
  expect(nav.queryByRole('link', { name: /Estoque/ })).toBeNull()
})

test('um lugar sem conversas diz "Nenhuma conversa neste lugar."; com busca, a frase da busca', async () => {
  const { conexus } = at(`${COMPANY_ROOT}?place=AUTOMATIONS`, { conversations: TWO })
  const nav = await list()
  expect(await nav.findByText('Nenhuma conversa neste lugar.')).toBeTruthy()
  await conexus.router.navigate({ to: '.', search: { place: 'AUTOMATIONS', q: 'zzz' } })
  expect(await nav.findByText('Nenhuma conversa com esse nome.')).toBeTruthy()
  expect(nav.queryByText('Nenhuma conversa neste lugar.')).toBeNull()
})

test('Sem Projeto com mais de 5 conversas tem Ver todas, que leva a place=HOME na aba Recentes', async () => {
  const six = Array.from({ length: 6 }, (_, index) =>
    assistantConversation({
      id: ConversationId.parse(`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0${index}`),
      title: `Avulsa ${index}`,
      updatedAt: `2026-11-02T1${index}:00:00Z`,
    }),
  )
  const { conexus } = at(`${COMPANY_ROOT}?tab=projects`, { conversations: six })
  const nav = await list()
  await waitFor(() => expect(nav.getAllByRole('link', { name: /Avulsa \d/ })).toHaveLength(5))
  fireEvent.click(nav.getByRole('link', { name: 'Ver todas' }))
  await waitFor(() => expect(conexus.router.state.location.search).toMatchObject({ place: 'HOME' }))
  expect(conexus.router.state.location.search).not.toHaveProperty('tab')
})
