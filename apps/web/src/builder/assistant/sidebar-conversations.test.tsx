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

// The company's list: Nova conversa and the person's conversations by day (step 13.3, criterion 6).
// The clock is 2 Nov 2026, 15:00 in São Paulo (the tests' TZ), and each instant is placed against
// that day in that zone: 22:00 of the 1st is yesterday here though it is already the 2nd in UTC.
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

test('a lista agrupa por dia no fuso do navegador: Hoje, Ontem, Esta semana, Antes, cada linha com a idade', async () => {
  at(COMPANY_ROOT, { conversations: BY_DAY })
  const nav = await list()
  expect(await nav.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(nav.getByRole('heading', { name: 'Conversas' })).toBeTruthy()
  const groups = nav.getAllByRole('region').map((group) => group.getAttribute('aria-label'))
  expect(groups).toEqual(['Hoje', 'Ontem', 'Esta semana', 'Antes'])
  const rows = {
    Hoje: ['De hoje', '2 h'],
    Ontem: ['De ontem à noite', 'ontem'],
    'Esta semana': ['Do começo da semana', '3 d'],
    Antes: ['Antiga', '20/10'],
  } as const
  for (const [group, [title, age]] of Object.entries(rows)) {
    const section = within(nav.getByRole('region', { name: group }))
    const link = section.getByRole('link', { name: new RegExp(title) })
    expect(within(link).getByText(age)).toBeTruthy()
  }
})

test('uma conversa de Projeto leva o nome dele e abre pelo endereço do Projeto', async () => {
  const { conexus } = at(COMPANY_ROOT, { conversations: BY_DAY })
  const nav = await list()
  const link = await nav.findByRole('link', { name: /Do começo da semana/ })
  expect(within(link).getByText('Pedidos')).toBeTruthy()
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
  // Inside the Projeto the list is the Projeto's own.
  expect(await (await list()).findByRole('link', { name: 'Construir' })).toBeTruthy()
})

test('sem conversas, a lista tem só Nova conversa', async () => {
  at(COMPANY_ROOT)
  const nav = await list()
  expect(await nav.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  await waitFor(() => expect(document.querySelector('[data-slot="skeleton"]')).toBeNull())
  expect(nav.queryByRole('heading', { name: 'Conversas' })).toBeNull()
  expect(nav.queryAllByRole('region')).toHaveLength(0)
})

test('a lista mostra a primeira página e o Pager leva à seguinte no endereço', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    pageSize: 2,
    conversations: [
      assistantConversation({
        id: ELSEWHERE,
        title: 'Gama',
        updatedAt: '2026-11-02T17:00:00Z',
      }),
      assistantConversation({ title: 'Beta', updatedAt: '2026-11-02T16:00:00Z' }),
      assistantConversation({ id: THIRD, title: 'Alfa', updatedAt: '2026-11-02T15:00:00Z' }),
    ],
  })
  const nav = await list()
  expect(await nav.findByRole('link', { name: /Gama/ })).toBeTruthy()
  expect(nav.queryByRole('link', { name: /Alfa/ })).toBeNull()
  fireEvent.click(nav.getByRole('link', { name: 'Ver mais: Conversas' }))
  expect(await nav.findByRole('link', { name: /Alfa/ })).toBeTruthy()
  expect(conexus.router.state.location.search).toMatchObject({ conversations: '2' })
  fireEvent.click(nav.getByRole('link', { name: 'Primeira página: Conversas' }))
  expect(await nav.findByRole('link', { name: /Gama/ })).toBeTruthy()
})

test('enquanto a lista não chega, linhas de esqueleto; se falha, a frase com Tentar de novo', async () => {
  let failing = true
  let arrive: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    arrive = resolve
  })
  at(COMPANY_ROOT, {
    conversations: [assistantConversation({ updatedAt: '2026-11-02T17:00:00Z' })],
    answers: {
      list: async () => {
        await held
        return failing ? refusal('DATABASE_UNAVAILABLE') : undefined
      },
    },
  })
  const nav = await list()
  expect(nav.queryByRole('link', { name: /Vendas da semana/ })).toBeNull()
  expect(document.querySelector('[data-sidebar="sidebar"] [data-slot="skeleton"]')).not.toBeNull()
  arrive()
  const retry = await nav.findByRole('button', { name: 'Tentar de novo' })
  expect(nav.getByRole('alert')).toBeTruthy()
  failing = false
  fireEvent.click(retry)
  expect(await nav.findByRole('link', { name: /Vendas da semana/ })).toBeTruthy()
})

test('o membro vê na lista os Projetos recentes, como hoje, e nenhuma conversa do Assistente', async () => {
  at(COMPANY_ROOT, { role: 'member', conversations: BY_DAY })
  const nav = await list()
  expect(await nav.findByText('Projetos recentes')).toBeTruthy()
  expect(nav.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
  expect(nav.queryByRole('link', { name: /De hoje/ })).toBeNull()
})

function fresh() {
  return BY_DAY.map((one) => ({ ...one }))
}

async function menuOf(title: string) {
  const nav = await list()
  const button = await nav.findByRole('button', { name: new RegExp(`Ações da conversa: ${title}`) })
  fireEvent.click(button)
  return nav
}

test('o ⋮ oferece Renomear e Apagar; renomear manda o título novo e a linha o mostra', async () => {
  const { writes } = at(COMPANY_ROOT, { conversations: fresh() })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
  const field = await screen.findByLabelText('Título da conversa')
  fireEvent.change(field, { target: { value: 'Vendas de outubro' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await (await list()).findByRole('link', { name: /Vendas de outubro/ })).toBeTruthy()
  expect(writes().map((one) => [one.method, one.body])).toEqual([
    ['PATCH', { title: 'Vendas de outubro' }],
  ])
})

test('renomear com o título vazio diz em português o que escrever e não manda nada', async () => {
  const { writes } = at(COMPANY_ROOT, { conversations: fresh() })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
  fireEvent.change(await screen.findByLabelText('Título da conversa'), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Escreva um título, com até 120 caracteres.')).toBeTruthy()
  expect(writes()).toHaveLength(0)
})

test('apagar pede a confirmação com dois botões; Cancelar não apaga, Apagar conversa tira a linha', async () => {
  const { writes } = at(COMPANY_ROOT, { conversations: fresh() })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Apagar esta conversa?' })
  expect(within(dialog).getByText(/Isto não se desfaz/)).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(writes()).toHaveLength(0)

  fireEvent.click(await (await list()).findByRole('button', { name: /Ações da conversa: De hoje/ }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  await waitFor(async () =>
    expect((await list()).queryByRole('link', { name: /De hoje/ })).toBeNull(),
  )
  expect(writes().map((one) => one.method)).toEqual(['DELETE'])
})

test('a confirmação de apagar abre com o foco em Cancelar, a ação menos destrutiva', async () => {
  at(COMPANY_ROOT, { conversations: fresh() })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Apagar esta conversa?' })
  await waitFor(() =>
    expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Cancelar' })),
  )
})

test('apagar uma conversa que já foi some da lista, sem erro', async () => {
  at(COMPANY_ROOT, {
    conversations: fresh(),
    answers: { remove: () => refusal('CONVERSATION_NOT_FOUND') },
  })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(screen.queryByRole('alert')).toBeNull()
})

test('apagar a conversa aberta leva a uma conversa nova', async () => {
  const { conexus } = at(`${COMPANY_ROOT}/conversations/${BY_DAY[0]?.conversation.id}`, {
    conversations: fresh(),
  })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  await waitFor(() => expect(conexus.router.state.location.pathname).toBe(COMPANY_ROOT))
})
