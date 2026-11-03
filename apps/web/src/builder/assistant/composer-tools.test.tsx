import type { SessionConnection } from '@conexus/hub-api'
import { ConnectionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  PEDIDOS_ID,
} from './test-hub.tsx'

// The "+" menu of the box's row (step 13.3, criteria 18, 19 and 22).
const server = hubServer()
const { at } = assistantScreens(server)

const PLUS = { name: 'Anexar e ferramentas' }

afterEach(() => vi.restoreAllMocks())

/** `count` tools of one connector, the first named for the store. */
function tools(count: number, chosen = true): SessionConnection[] {
  return Array.from({ length: count }, (_, n) => ({
    connectionId: ConnectionId.parse(
      `${String(n + 1).padStart(8, '0')}-dddd-4ddd-8ddd-dddddddddddd`,
    ),
    connector: 'sankhya',
    name: n === 0 ? 'Loja do centro' : `Filial ${n}`,
    chosen,
  }))
}

async function openMenu() {
  fireEvent.click(await screen.findByRole('button', PLUS))
  return screen.findByRole('dialog', PLUS)
}

test('o menu: o "+" abre Anexar arquivo, as ferramentas com os interruptores e Conectar outra ferramenta', async () => {
  at(COMPANY_ROOT)
  const menu = await openMenu()
  expect(within(menu).getByRole('button', { name: /Anexar arquivo/ })).toBeTruthy()
  expect(within(menu).getByText('Ferramentas da conversa')).toBeTruthy()
  expect(within(menu).getByText('2 de 2 ligadas')).toBeTruthy()
  expect(within(menu).getAllByRole('switch')).toHaveLength(2)
  const link = within(menu).getByRole('link', { name: 'Conectar outra ferramenta' })
  expect(link.getAttribute('href')).toBe(`${COMPANY_ROOT}/integrations`)
})

test('o menu: Anexar arquivo fecha o menu e abre a escolha de arquivos', async () => {
  at(COMPANY_ROOT)
  const click = vi.spyOn(HTMLInputElement.prototype, 'click')
  const menu = await openMenu()
  fireEvent.click(within(menu).getByRole('button', { name: /Anexar arquivo/ }))
  await waitFor(() => expect(screen.queryByRole('dialog', PLUS)).toBeNull())
  expect(click).toHaveBeenCalledTimes(1)
})

test('o menu: num Projeto a saída é Liberar outra ferramenta ao Projeto, nas Integrações dele', async () => {
  at(`${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`, {
    conversations: [assistantConversation({ projectId: PEDIDOS_ID })],
  })
  const menu = await openMenu()
  const link = within(menu).getByRole('link', { name: 'Liberar outra ferramenta ao Projeto' })
  expect(link.getAttribute('href')).toBe(`${COMPANY_ROOT}/projects/${PEDIDOS_ID}/integrations`)
})

test('o menu: abaixo de 768 px abre numa folha de baixo para cima, com o mesmo título', async () => {
  const query = globalThis.matchMedia
  globalThis.matchMedia = (media: string) =>
    Object.assign(query(media), { matches: media === '(max-width: 767px)' })
  try {
    at(COMPANY_ROOT)
    const sheet = await openMenu()
    expect(within(sheet).getByRole('heading', PLUS)).toBeTruthy()
    expect(within(sheet).getAllByRole('switch')).toHaveLength(2)
  } finally {
    globalThis.matchMedia = query
  }
})

test('a busca: com 11 ferramentas aparece, "loja" filtra pelo nome e sem resultado diz a frase', async () => {
  at(COMPANY_ROOT, { offered: tools(11) })
  const menu = await openMenu()
  const search = await within(menu).findByRole('searchbox', { name: 'Buscar ferramenta' })
  expect(await within(menu).findAllByRole('switch')).toHaveLength(11)
  fireEvent.change(search, { target: { value: 'loja' } })
  expect(within(menu).getAllByRole('switch')).toHaveLength(1)
  fireEvent.change(search, { target: { value: 'padaria' } })
  expect(within(menu).queryAllByRole('switch')).toHaveLength(0)
  expect(within(menu).getByText('Nenhuma ferramenta com esse nome.')).toBeTruthy()
})

test('a busca: com 6 ferramentas não há busca', async () => {
  at(COMPANY_ROOT, { offered: tools(6) })
  const menu = await openMenu()
  expect(await within(menu).findAllByRole('switch')).toHaveLength(6)
  expect(within(menu).queryByRole('searchbox')).toBeNull()
})

test('a contagem: mostra até 3 logos e o número, e tocar nela abre o "+"', async () => {
  at(COMPANY_ROOT, { offered: tools(5) })
  const count = await screen.findByRole('button', { name: '5 ferramentas' })
  expect(count.querySelectorAll('img')).toHaveLength(3)
  fireEvent.click(count)
  expect(await screen.findByRole('dialog', PLUS)).toBeTruthy()
})

test('a contagem: sem ferramenta no lugar, o menu diz a frase e leva às Integrações', async () => {
  at(COMPANY_ROOT, { offered: [] })
  fireEvent.click(await screen.findByRole('button', { name: 'Sem ferramentas' }))
  const menu = await screen.findByRole('dialog', PLUS)
  expect(within(menu).getByText('Nenhuma ferramenta ligada à empresa')).toBeTruthy()
  expect(within(menu).getByRole('link', { name: 'Conectar outra ferramenta' })).toBeTruthy()
})

test('a contagem: num Projeto sem ferramenta liberada, o menu diz a frase do Projeto', async () => {
  at(`${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`, {
    conversations: [assistantConversation({ projectId: PEDIDOS_ID, connections: [] })],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Sem ferramentas' }))
  const menu = await screen.findByRole('dialog', PLUS)
  expect(within(menu).getByText('Liberar um sistema em Integrações do Projeto')).toBeTruthy()
})
