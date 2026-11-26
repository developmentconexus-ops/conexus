import { CONVERSATION_SEARCH_MAX, ConversationId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { choose } from '../../harness/room/test-hub.tsx'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  PEDIDOS_ID,
  THIRD,
} from './test-hub.tsx'

// Conversas: the search, the place filter and the Projetos tab, all in the address (card R2, U1, criterion 1).
const server = hubServer()
const { at } = assistantScreens(server)
const PAGE = `${COMPANY_ROOT}/conversations`

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-02T18:00:00Z') }))
afterEach(() => vi.useRealTimers())

/** The sheet of Conversas, once its title is up; the column beside it lists "Recentes" with the same titles. */
async function sheet() {
  await screen.findByRole('heading', { name: 'Conversas', level: 1 })
  return within(screen.getByRole('main'))
}

const TWO = [
  assistantConversation({ title: 'De hoje', updatedAt: '2026-11-02T16:00:00Z' }),
  assistantConversation({ id: ELSEWHERE, title: 'De ontem', updatedAt: '2026-11-02T01:00:00Z' }),
]

const HOME_AND_PROJECT = [
  assistantConversation({ title: 'Da casa', updatedAt: '2026-11-02T17:00:00Z' }),
  assistantConversation({
    id: THIRD,
    title: 'Do Projeto',
    updatedAt: '2026-11-02T16:00:00Z',
    projectId: PEDIDOS_ID,
  }),
]

function six(title: string, projectId: typeof PEDIDOS_ID | null) {
  return Array.from({ length: 6 }, (_, index) =>
    assistantConversation({
      id: ConversationId.parse(`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0${index}`),
      title: `${title} ${index}`,
      updatedAt: `2026-11-02T1${index}:00:00Z`,
      projectId,
    }),
  )
}

test('a busca: digitar parte do título, sem acento nem caixa, deixa só essas, no endereço; sem nenhuma, a frase; o endereço reabre a mesma lista', async () => {
  const { conexus } = at(PAGE, {
    conversations: [
      assistantConversation({ title: 'Relatório de Outubro', updatedAt: '2026-11-02T17:00:00Z' }),
      assistantConversation({
        id: ELSEWHERE,
        title: 'Estoque parado',
        updatedAt: '2026-11-02T16:00:00Z',
      }),
    ],
  })
  const main = await sheet()
  const box = main.getByRole('searchbox', { name: 'Buscar pelo título' })
  fireEvent.change(box, { target: { value: 'RELATORIO' } })
  expect(await main.findByRole('link', { name: /Relatório de Outubro/ })).toBeTruthy()
  await waitFor(() => expect(main.queryByRole('link', { name: /Estoque parado/ })).toBeNull())
  expect(conexus.router.state.location.search).toMatchObject({ q: 'RELATORIO' })
  fireEvent.change(box, { target: { value: 'nada disso' } })
  expect(await main.findByText('Nenhuma conversa com esse nome.')).toBeTruthy()
  fireEvent.change(box, { target: { value: '' } })
  expect(await main.findByRole('link', { name: /Estoque parado/ })).toBeTruthy()
  expect(conexus.router.state.location.search).not.toHaveProperty('q')
})

test('o endereço com ?q= abre a página com a busca preenchida e o foco fora do campo', async () => {
  at(`${PAGE}?q=hoje`, { conversations: TWO })
  const main = await sheet()
  const box = main.getByRole('searchbox', { name: 'Buscar pelo título' })
  expect(main.getByDisplayValue('hoje')).toBe(box)
  expect(await main.findByRole('link', { name: /De hoje/ })).toBeTruthy()
  await waitFor(() => expect(main.queryByRole('link', { name: /ontem/ })).toBeNull())
  expect(document.activeElement).not.toBe(box)
})

test('o campo da busca limita o texto ao do contrato', async () => {
  at(PAGE, { conversations: TWO })
  const main = await sheet()
  const box = main.getByRole('searchbox', { name: 'Buscar pelo título' })
  expect(box.getAttribute('maxlength')).toBe(String(CONVERSATION_SEARCH_MAX))
})

// The Hub refuses a text of only spaces or over its length; the address then carries a text that is no search.
test.each([['%20%20%20'], ['a'.repeat(101)]])(
  'uma busca que o Hub recusaria (%#) não vira erro: a lista segue inteira',
  async (q) => {
    at(`${PAGE}?q=${q}`, { conversations: TWO })
    const main = await sheet()
    expect(await main.findByRole('link', { name: /De hoje/ })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(main.queryByText('Nenhuma conversa com esse nome.')).toBeNull()
  },
)

test('digitar na busca mantém a lista à vista até a resposta chegar, sem esqueleto a cada letra', async () => {
  at(PAGE, { conversations: TWO })
  const main = await sheet()
  await main.findByRole('link', { name: /De hoje/ })
  let most = 0
  const watch = new MutationObserver(() => {
    most = Math.max(most, document.querySelectorAll('main [data-slot="skeleton"]').length)
  })
  watch.observe(document.body, { childList: true, subtree: true })
  const box = main.getByRole('searchbox', { name: 'Buscar pelo título' })
  for (const text of ['d', 'de', 'de h']) fireEvent.change(box, { target: { value: text } })
  await waitFor(() => expect(main.queryByRole('link', { name: /ontem/ })).toBeNull())
  watch.disconnect()
  expect(most).toBe(0)
})

test('o lugar: o filtro mostra só as daquele lugar com um rótulo e ×, e o × tira o filtro do endereço', async () => {
  const { conexus } = at(PAGE, { conversations: HOME_AND_PROJECT })
  const main = await sheet()
  await choose(await main.findByRole('combobox', { name: 'Filtrar conversas' }), 'Início')
  await waitFor(() => expect(main.queryByRole('link', { name: /Do Projeto/ })).toBeNull())
  expect(await main.findByRole('link', { name: /Da casa/ })).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  expect(conexus.router.state.location.search).toMatchObject({ place: 'HOME' })
  fireEvent.click(main.getByRole('button', { name: 'Tirar o filtro: Início' }))
  expect(await main.findByRole('link', { name: /Do Projeto/ })).toBeTruthy()
  expect(conexus.router.state.location.search).not.toHaveProperty('place')
})

test('o endereço com um Projeto no lugar abre as conversas dele com o nome do Projeto no rótulo', async () => {
  at(`${PAGE}?place=${PEDIDOS_ID}`, { conversations: HOME_AND_PROJECT })
  const main = await sheet()
  expect(await main.findByRole('link', { name: /Do Projeto/ })).toBeTruthy()
  expect(main.queryByRole('link', { name: /Da casa/ })).toBeNull()
  expect(await main.findByRole('button', { name: 'Tirar o filtro: Pedidos' })).toBeTruthy()
})

test('trocar de lugar com a resposta a caminho mostra os esqueletos, nunca a lista do lugar anterior', async () => {
  const answer = Promise.withResolvers<undefined>()
  let held: Promise<undefined> | undefined
  at(PAGE, { conversations: TWO, answers: { list: () => held } })
  const main = await sheet()
  await main.findByRole('link', { name: /De hoje/ })
  held = answer.promise
  await choose(await main.findByRole('combobox', { name: 'Filtrar conversas' }), 'Início')
  const status = await main.findByRole('status', { name: 'Carregando' })
  expect(status.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  expect(main.queryByRole('link', { name: /De hoje/ })).toBeNull()
  answer.resolve(undefined)
  expect(await main.findByRole('link', { name: /De hoje/ })).toBeTruthy()
})

test('um lugar sem conversas diz "Nenhuma conversa neste lugar."; com busca, a frase da busca', async () => {
  const { conexus } = at(`${PAGE}?place=AUTOMATIONS`, { conversations: TWO })
  const main = await sheet()
  expect(await main.findByText('Nenhuma conversa neste lugar.')).toBeTruthy()
  await conexus.router.navigate({ to: '.', search: { place: 'AUTOMATIONS', q: 'zzz' } })
  expect(await main.findByText('Nenhuma conversa com esse nome.')).toBeTruthy()
  expect(main.queryByText('Nenhuma conversa neste lugar.')).toBeNull()
})

test('a aba Projetos: um grupo por Projeto com as conversas dele e Sem Projeto no fim', async () => {
  const { conexus } = at(PAGE, { conversations: HOME_AND_PROJECT })
  const main = await sheet()
  fireEvent.click(await main.findByRole('tab', { name: 'Projetos' }))
  expect(conexus.router.state.location.search).toMatchObject({ tab: 'projects' })
  const project = await main.findByRole('button', { name: /Pedidos/ })
  const without = await main.findByRole('button', { name: /Sem Projeto/ })
  expect(project.compareDocumentPosition(without) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  const row = await main.findByRole('link', { name: /Do Projeto/ })
  expect(row.textContent).not.toContain('Pedidos')
  expect(await main.findByRole('link', { name: /Da casa/ })).toBeTruthy()
  expect(main.queryByRole('combobox', { name: 'Filtrar conversas' })).toBeNull()
})

test('a aba Projetos mostra até 5 conversas de um Projeto, e Ver todas leva a place=<Projeto> na aba Recentes', async () => {
  const { conexus } = at(`${PAGE}?tab=projects`, { conversations: six('Pedido', PEDIDOS_ID) })
  const main = await sheet()
  await main.findByRole('button', { name: /Sem Projeto/ })
  await waitFor(() => expect(main.getAllByRole('link', { name: /Pedido \d/ })).toHaveLength(5))
  fireEvent.click(main.getByRole('link', { name: 'Ver todas' }))
  await waitFor(() =>
    expect(conexus.router.state.location.search).toMatchObject({ place: PEDIDOS_ID }),
  )
  expect(conexus.router.state.location.search).not.toHaveProperty('tab')
  expect(await main.findByRole('tab', { name: 'Recentes', selected: true })).toBeTruthy()
})

test('Sem Projeto com mais de 5 conversas tem Ver todas, que leva a place=HOME na aba Recentes', async () => {
  const { conexus } = at(`${PAGE}?tab=projects`, { conversations: six('Avulsa', null) })
  const main = await sheet()
  await waitFor(() => expect(main.getAllByRole('link', { name: /Avulsa \d/ })).toHaveLength(5))
  fireEvent.click(main.getByRole('link', { name: 'Ver todas' }))
  await waitFor(() => expect(conexus.router.state.location.search).toMatchObject({ place: 'HOME' }))
  expect(conexus.router.state.location.search).not.toHaveProperty('tab')
})

test('na aba Projetos a busca vale dentro de cada grupo, e o filtro de lugar sai; um grupo sem achado diz a frase da busca', async () => {
  at(`${PAGE}?q=relatorio&place=HOME&tab=projects`, {
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
  const main = await sheet()
  expect(await main.findByRole('link', { name: /Relatório da casa/ })).toBeTruthy()
  expect(main.queryByRole('link', { name: /Estoque/ })).toBeNull()
  expect(await main.findByText('Nenhuma conversa com esse nome.')).toBeTruthy()
  expect(main.queryByText('Nenhuma conversa neste Projeto ainda.')).toBeNull()
  expect(main.queryByRole('combobox', { name: 'Filtrar conversas' })).toBeNull()
  expect(main.queryByRole('button', { name: /Tirar o filtro/ })).toBeNull()
  expect(main.getByRole('searchbox', { name: 'Buscar pelo título' })).toBeTruthy()
  fireEvent.click(main.getByRole('tab', { name: 'Recentes' }))
  expect(await main.findByRole('button', { name: 'Tirar o filtro: Início' })).toBeTruthy()
  expect(await main.findByRole('link', { name: /Relatório da casa/ })).toBeTruthy()
  expect(main.queryByRole('link', { name: /Estoque/ })).toBeNull()
})
