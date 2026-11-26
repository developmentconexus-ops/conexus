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

// "Recentes" in the column: the person's eight newest conversations, the short list (card R2, U1, criterion 2).
// The clock is 2 Nov 2026, 15:00 in São Paulo (the tests' TZ).
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

/** Ten conversations, newest first as the Hub lists them. */
const TEN = Array.from({ length: 10 }, (_, index) =>
  assistantConversation({
    id: ConversationId.parse(`aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0${index}`),
    title: `Recente ${index}`,
    updatedAt: `2026-11-02T17:${String(59 - index)}:00Z`,
  }),
)

test('as oito mais recentes', async () => {
  at(COMPANY_ROOT, { conversations: TEN })
  const nav = await list()
  expect(await nav.findByText('Recentes')).toBeTruthy()
  expect(await nav.findByRole('link', { name: /Recente 0/ })).toBeTruthy()
  const shown = nav.getAllByRole('link', { name: /Recente \d/ })
  expect(shown.map((link) => link.textContent)).toEqual(
    Array.from({ length: 8 }, (_, index) => expect.stringContaining(`Recente ${index}`)),
  )
  expect(nav.queryByRole('link', { name: /Recente 8/ })).toBeNull()
  expect(nav.queryByRole('link', { name: /Recente 9/ })).toBeNull()
  // The search, the filter, the tabs, the days and the pager are the page's (criterion 1).
  expect(nav.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(nav.queryByRole('searchbox')).toBeNull()
  expect(nav.queryByRole('combobox', { name: 'Filtrar conversas' })).toBeNull()
  expect(nav.queryByRole('tab')).toBeNull()
  expect(nav.queryByRole('region')).toBeNull()
  expect(nav.queryByRole('link', { name: /^Ver mais/ })).toBeNull()
})

test('sem conversa o grupo não aparece', async () => {
  at(COMPANY_ROOT)
  const nav = await list()
  expect(await nav.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  await waitFor(() =>
    expect(document.querySelector('[data-slot="sidebar-menu-skeleton"]')).toBeNull(),
  )
  expect(nav.queryByText('Recentes')).toBeNull()
})

test('a leitura que falha não derruba a lista: o grupo some e Nova conversa segue', async () => {
  at(COMPANY_ROOT, {
    conversations: BY_DAY,
    answers: { list: () => refusal('DATABASE_UNAVAILABLE') },
  })
  const nav = await list()
  expect(await nav.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  await waitFor(() =>
    expect(document.querySelector('[data-slot="sidebar-menu-skeleton"]')).toBeNull(),
  )
  expect(nav.queryByText('Recentes')).toBeNull()
  expect(nav.queryByRole('link', { name: /De hoje/ })).toBeNull()
  expect(nav.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(nav.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
})

test('enquanto a lista não chega, o rótulo e três linhas de esqueleto', async () => {
  const arrival = Promise.withResolvers<undefined>()
  at(COMPANY_ROOT, { conversations: BY_DAY, answers: { list: () => arrival.promise } })
  const nav = await list()
  expect(await nav.findByText('Recentes')).toBeTruthy()
  expect(
    document.querySelectorAll('[data-sidebar="sidebar"] [data-slot="sidebar-menu-skeleton"]'),
  ).toHaveLength(3)
  arrival.resolve(undefined)
  expect(await nav.findByRole('link', { name: /De hoje/ })).toBeTruthy()
})

test('a conversa aberta fica marcada e as outras não', async () => {
  at(`${COMPANY_ROOT}/conversations/${BY_DAY[0]?.conversation.id}`, { conversations: BY_DAY })
  const nav = await list()
  expect((await nav.findByRole('link', { name: /De hoje/ })).getAttribute('aria-current')).toBe(
    'page',
  )
  expect(
    nav.getByRole('link', { name: /De ontem à noite/ }).getAttribute('aria-current'),
  ).toBeNull()
})

test('cada linha leva a idade, e uma conversa de Projeto o nome dele e abre pelo endereço do Projeto', async () => {
  const { conexus } = at(COMPANY_ROOT, { conversations: BY_DAY })
  const nav = await list()
  expect(within(await nav.findByRole('link', { name: /De hoje/ })).getByText('2 h')).toBeTruthy()
  const link = nav.getByRole('link', { name: /Do começo da semana/ })
  expect(within(link).getByText('Pedidos')).toBeTruthy()
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
  // Inside the Projeto the bar is the Projeto's own: no "Recentes" of the company.
  expect(await (await list()).findByRole('link', { name: 'Construir' })).toBeTruthy()
  expect((await list()).queryByText('Recentes')).toBeNull()
})

test('em Dados a coluna é a de toda área da empresa: Nova conversa e Recentes, sem uma árvore de Dados', async () => {
  at(`${COMPANY_ROOT}/data`, { conversations: BY_DAY })
  const nav = await list()
  expect(await nav.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(await nav.findByText('Recentes')).toBeTruthy()
  expect(await nav.findByRole('link', { name: /De hoje/ })).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Dados' })).toBeNull()
})

test('o membro vê em Recentes as suas conversas, como a dona', async () => {
  at(COMPANY_ROOT, { role: 'member', conversations: BY_DAY })
  const nav = await list()
  expect(await nav.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(await nav.findByRole('link', { name: /De hoje/ })).toBeTruthy()
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
    ['PUT', { title: 'Vendas de outubro' }],
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
  const held = fresh()
  at(COMPANY_ROOT, {
    conversations: held,
    // The Hub no longer holds it when it answers, as it would after the person's other tab.
    answers: {
      remove: () => {
        held.splice(0, held.length)
        return refusal('CONVERSATION_NOT_FOUND')
      },
    },
  })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(screen.queryByRole('alert')).toBeNull()
  await waitFor(async () =>
    expect((await list()).queryByRole('link', { name: /De hoje/ })).toBeNull(),
  )
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

test('apagar a conversa aberta leva a uma conversa nova mesmo com uma leitura recarregada ainda no ar', async () => {
  let reads = 0
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  const { conexus } = at(`${COMPANY_ROOT}/conversations/${BY_DAY[0]?.conversation.id}`, {
    conversations: fresh(),
    answers: {
      // The first read is the screen's own; the ones after the delete are the cache's reload.
      list: async () => {
        reads += 1
        if (reads > 1) await held
        return undefined
      },
    },
  })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  try {
    await waitFor(() => expect(conexus.router.state.location.pathname).toBe(COMPANY_ROOT))
    expect(screen.queryByText('Esta conversa não existe mais.')).toBeNull()
  } finally {
    release()
  }
})

function heldReloads() {
  let reads = 0
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  return {
    release: () => release(),
    // The first read is the screen's own; the ones after the delete are the cache's reload.
    list: async () => {
      reads += 1
      if (reads > 1) await held
      return undefined
    },
  }
}

test('apagar fecha a confirmação ao apagar, sem esperar a lista recarregar', async () => {
  const reload = heldReloads()
  at(COMPANY_ROOT, { conversations: fresh(), answers: { list: reload.list } })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  try {
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  } finally {
    reload.release()
  }
})

test('apagar a conversa aberta que já foi leva a uma conversa nova mesmo com a lista recarregada ainda no ar', async () => {
  const reload = heldReloads()
  const { conexus } = at(`${COMPANY_ROOT}/conversations/${BY_DAY[0]?.conversation.id}`, {
    conversations: fresh(),
    answers: { list: reload.list, remove: () => refusal('CONVERSATION_NOT_FOUND') },
  })
  await menuOf('De hoje')
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar conversa' }))
  try {
    await waitFor(() => expect(conexus.router.state.location.pathname).toBe(COMPANY_ROOT))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(screen.queryByText('Esta conversa não existe mais.')).toBeNull()
  } finally {
    reload.release()
  }
})
