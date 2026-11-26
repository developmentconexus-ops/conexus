import { ConversationId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import {
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  PEDIDOS_ID,
  THIRD,
} from './test-hub.tsx'

// Conversas: the person's conversations by day, the pager and the states (card R2, U1, criterion 1).
// The clock is 2 Nov 2026, 15:00 in São Paulo (the tests' TZ), and each instant is placed against
// that day in that zone: 22:00 of the 1st is yesterday here though it is already the 2nd in UTC.
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

const BY_DAY = [
  assistantConversation({ title: 'De hoje', updatedAt: '2026-11-02T16:00:00Z' }),
  assistantConversation({
    id: ELSEWHERE,
    title: 'De ontem à noite',
    updatedAt: '2026-11-02T01:00:00Z',
  }),
  assistantConversation({
    id: THIRD,
    title: 'Do começo da semana',
    updatedAt: '2026-10-30T13:00:00Z',
    projectId: PEDIDOS_ID,
  }),
  assistantConversation({
    id: ConversationId.parse('66666666-6666-4666-8666-666666666666'),
    title: 'Antiga',
    updatedAt: '2026-10-20T13:00:00Z',
  }),
]

test('a lista por dia, a busca e o filtro no endereço: Hoje, Ontem, Esta semana, Antes, cada linha com a idade', async () => {
  at(PAGE, { conversations: BY_DAY })
  const main = await sheet()
  expect(await main.findByRole('link', { name: /De hoje/ })).toBeTruthy()
  const groups = main.getAllByRole('region').map((group) => group.getAttribute('aria-label'))
  expect(groups).toEqual(['Conversas', 'Hoje', 'Ontem', 'Esta semana', 'Antes'])
  const rows = {
    Hoje: ['De hoje', '2 h'],
    Ontem: ['De ontem à noite', 'ontem'],
    'Esta semana': ['Do começo da semana', '3 d'],
    Antes: ['Antiga', '20/10'],
  } as const
  for (const [group, [title, age]] of Object.entries(rows)) {
    const section = within(main.getByRole('region', { name: group }))
    const link = section.getByRole('link', { name: new RegExp(title) })
    expect(within(link).getByText(age)).toBeTruthy()
  }
  // The search is always in view and "Nova conversa" is the column's, not the page's.
  expect(main.getByRole('searchbox', { name: 'Buscar pelo título' })).toBeTruthy()
  expect(main.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
})

/** The whole list, as an address with a place that is no place opens it. */
async function wholeList(place: string) {
  at(`${PAGE}?place=${place}`, { conversations: BY_DAY })
  const main = await sheet()
  expect(await main.findByRole('link', { name: /De hoje/ })).toBeTruthy()
  expect(main.getByRole('link', { name: /Do começo da semana/ })).toBeTruthy()
  expect(main.queryByRole('button', { name: /^Tirar o filtro/ })).toBeNull()
  expect(main.queryByText('Nenhuma conversa neste lugar.')).toBeNull()
}

// A place that is no `HOME`, no `AUTOMATIONS` and no Projeto id is left out of the view.
test('um lugar inválido abre a lista inteira', async () => {
  await wholeList('qualquer-coisa')
})

test.each(['home', '11111111'])(
  'um lugar quase válido, ?place=%s, também abre a lista inteira',
  wholeList,
)

test('uma conversa de Projeto leva o nome dele e abre pelo endereço do Projeto', async () => {
  const { conexus } = at(PAGE, { conversations: BY_DAY })
  const main = await sheet()
  const link = await main.findByRole('link', { name: /Do começo da semana/ })
  expect(within(link).getByText('Pedidos')).toBeTruthy()
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
  // Inside the Projeto the bar is the Projeto's own.
  expect(await screen.findByRole('link', { name: 'Construir' })).toBeTruthy()
})

test('a lista mostra a primeira página e o Pager leva à seguinte no endereço', async () => {
  const { conexus } = at(PAGE, {
    pageSize: 2,
    conversations: [
      assistantConversation({ id: ELSEWHERE, title: 'Gama', updatedAt: '2026-11-02T17:00:00Z' }),
      assistantConversation({ title: 'Beta', updatedAt: '2026-11-02T16:00:00Z' }),
      assistantConversation({ id: THIRD, title: 'Alfa', updatedAt: '2026-11-02T15:00:00Z' }),
    ],
  })
  const main = await sheet()
  expect(await main.findByRole('link', { name: /Gama/ })).toBeTruthy()
  expect(main.queryByRole('link', { name: /Alfa/ })).toBeNull()
  fireEvent.click(main.getByRole('link', { name: 'Ver mais: Conversas' }))
  expect(await main.findByRole('link', { name: /Alfa/ })).toBeTruthy()
  expect(conexus.router.state.location.search).toMatchObject({ conversations: '2' })
  fireEvent.click(main.getByRole('link', { name: 'Primeira página: Conversas' }))
  expect(await main.findByRole('link', { name: /Gama/ })).toBeTruthy()
  expect(conexus.router.state.location.search).not.toHaveProperty('conversations')
})

test('enquanto a lista não chega, três linhas de esqueleto; se falha, a frase com Tentar de novo', async () => {
  let failing = true
  const arrival = Promise.withResolvers<void>()
  at(PAGE, {
    conversations: [assistantConversation({ updatedAt: '2026-11-02T17:00:00Z' })],
    answers: {
      list: async () => {
        await arrival.promise
        return failing ? refusal('DATABASE_UNAVAILABLE') : undefined
      },
    },
  })
  const main = await sheet()
  const status = main.getByRole('status', { name: 'Carregando' })
  expect(status.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  expect(main.queryByRole('link', { name: /Vendas da semana/ })).toBeNull()
  arrival.resolve()
  const retry = await main.findByRole('button', { name: 'Tentar de novo' })
  expect(main.getByRole('alert')).toBeTruthy()
  failing = false
  fireEvent.click(retry)
  expect(await main.findByRole('link', { name: /Vendas da semana/ })).toBeTruthy()
})

test('sem nenhuma conversa a página diz "Nenhuma conversa ainda." e a coluna não tem Recentes', async () => {
  at(PAGE)
  const main = await sheet()
  expect(await main.findByText('Nenhuma conversa ainda.')).toBeTruthy()
  expect(main.queryByRole('region', { name: 'Hoje' })).toBeNull()
  expect(main.queryByText('Nenhuma conversa com esse nome.')).toBeNull()
  expect(
    within(screen.getByRole('navigation', { name: 'Navegação' })).queryByText('Recentes'),
  ).toBeNull()
})

test('o membro vê as suas conversas, como a dona', async () => {
  at(PAGE, { role: 'member', conversations: BY_DAY })
  const main = await sheet()
  expect(await main.findByRole('link', { name: /De hoje/ })).toBeTruthy()
  expect(main.queryByText('Projetos recentes')).toBeNull()
})

test('o menu da linha: renomear manda o título novo e a linha o mostra', async () => {
  const { writes } = at(PAGE, { conversations: BY_DAY.map((one) => ({ ...one })) })
  const main = await sheet()
  fireEvent.click(await main.findByRole('button', { name: /Ações da conversa: De hoje/ }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
  fireEvent.change(await screen.findByLabelText('Título da conversa'), {
    target: { value: 'Vendas de outubro' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await main.findByRole('link', { name: /Vendas de outubro/ })).toBeTruthy()
  expect(writes().map((one) => [one.method, one.body])).toEqual([
    ['PUT', { title: 'Vendas de outubro' }],
  ])
})

test('o menu da linha: Cancelar não apaga e Apagar conversa tira a linha da página', async () => {
  const { writes } = at(PAGE, { conversations: BY_DAY.map((one) => ({ ...one })) })
  const main = await sheet()
  fireEvent.click(await main.findByRole('button', { name: /Ações da conversa: De hoje/ }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Apagar esta conversa?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(writes()).toHaveLength(0)

  fireEvent.click(await main.findByRole('button', { name: /Ações da conversa: De hoje/ }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  await waitFor(() => expect(main.queryByRole('link', { name: /De hoje/ })).toBeNull())
  expect(writes().map((one) => one.method)).toEqual(['DELETE'])
})
