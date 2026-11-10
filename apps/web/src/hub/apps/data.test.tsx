import type { AppRows, AppTables } from '@conexus/hub-api'
import { AppRows as RowsShape, AppTables as TablesShape } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const API = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

const TABLES: AppTables = TablesShape.parse({
  kind: 'TABLES',
  tables: [
    { name: 'anotacoes', rows: { kind: 'EXACT', rows: 37 } },
    { name: 'clientes', rows: { kind: 'EXACT', rows: 1284 } },
    { name: 'logs', rows: { kind: 'OVER' } },
    { name: 'metas', rows: { kind: 'EXACT', rows: 0 } },
    { name: 'sobras', rows: { kind: 'UNKNOWN' } },
  ],
})
const LONG = 'x'.repeat(100)
const FIRST: AppRows = RowsShape.parse({
  columns: [{ name: 'id' }, { name: 'nome' }, { name: 'cidade' }],
  rows: [
    [
      { text: '1', cut: false },
      { text: 'Padaria Sol', cut: false },
      { text: LONG, cut: true },
    ],
    [{ text: '2', cut: false }, { text: 'Mercado Lua', cut: false }, null],
  ],
  next: { kind: 'MORE', page: 'NTA' },
})
const SECOND: AppRows = RowsShape.parse({
  columns: FIRST.columns,
  rows: [[{ text: '51', cut: false }, { text: 'Loja Mar', cut: false }, null]],
  next: { kind: 'END' },
})
const EMPTY: AppRows = RowsShape.parse({
  columns: [{ name: 'id' }, { name: 'meta' }],
  rows: [],
  next: { kind: 'END' },
})

const asked: { table: string; page: string | null }[] = []

type View = {
  tables: () => Response | AppTables
  rows?: (table: string, page: string | null) => Response | AppRows | Promise<Response | AppRows>
}

function answer(value: Response | AppTables | AppRows) {
  return value instanceof Response ? value : HttpResponse.json(value)
}

function open(path: string, view: View, role = 'owner') {
  asked.length = 0
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }),
    http.get(`${API}/tables`, () => answer(view.tables())),
    http.get(`${API}/tables/:table/rows`, async ({ params, request }) => {
      const table = String(params.table)
      const page = new URL(request.url).searchParams.get('page')
      asked.push({ table, page })
      const rows = view.rows
      if (rows === undefined) return refusal('NOT_FOUND')
      return answer(await rows(table, page))
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

function rowsOf(table: string, page: string | null) {
  if (table === 'metas') return EMPTY
  if (table !== 'clientes') return refusal('NOT_FOUND')
  return page === null ? FIRST : SECOND
}

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

test('Dados: o menu e quem não vê', async () => {
  open(`${PROJECT}/data`, { tables: () => TABLES, rows: rowsOf }, 'developer')
  const menu = await screen.findByRole('navigation', { name: 'Navegação' })
  const links = within(menu)
    .getAllByRole('link')
    .map((link) => link.textContent)
  expect(links.slice(links.indexOf('Integrações'))).toEqual(['Integrações', 'Dados'])
  expect(await screen.findByRole('heading', { name: 'Dados' })).toBeTruthy()
})

test('Dados: o menu e quem não vê, o membro não tem a entrada e o endereço dá "não encontrado" no conteúdo', async () => {
  open(`${PROJECT}/data`, { tables: () => refusal('NOT_FOUND') }, 'member')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  const menu = screen.getByRole('navigation', { name: 'Navegação' })
  expect(within(menu).queryByRole('link', { name: 'Dados' })).toBeNull()
  const hrefs = within(menu)
    .getAllByRole('link')
    .map((link) => link.getAttribute('href'))
  expect(hrefs).toContain(`${PROJECT}/integrations`)
})

test('Dados: a lista', async () => {
  open(`${PROJECT}/data`, { tables: () => TABLES })
  const list = within(await screen.findByRole('navigation', { name: 'Tabelas' }))
  const shown = list.getAllByRole('link').map((link) => link.textContent)
  expect(shown).toEqual([
    'anotacoes37',
    'clientes1.284',
    'logsmais de 10.000',
    'metas0',
    'sobrasindisponível',
  ])
  expect(list.getByRole('link', { name: /^clientes/ }).getAttribute('href')).toBe(
    `${PROJECT}/data/clientes`,
  )
})

test('Dados: a lista, um Projeto sem app e um app sem tabelas dizem cada um a sua frase', async () => {
  open(`${PROJECT}/data`, { tables: () => TablesShape.parse({ kind: 'NO_APP' }) })
  expect(
    await screen.findByText('Este Projeto ainda não tem app. Peça um ao Builder.'),
  ).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Tabelas' })).toBeNull()
})

test('Dados: a lista, um app sem tabelas', async () => {
  open(`${PROJECT}/data`, { tables: () => TablesShape.parse({ kind: 'TABLES', tables: [] }) })
  expect(await screen.findByText('O app ainda não criou tabelas.')).toBeTruthy()
})

test('Dados: as linhas em páginas', async () => {
  open(`${PROJECT}/data/clientes`, { tables: () => TABLES, rows: rowsOf })
  const grid = await screen.findByRole('table')
  expect(
    within(grid)
      .getAllByRole('columnheader')
      .map((head) => head.textContent),
  ).toEqual(['id', 'nome', 'cidade'])
  expect(within(grid).getByText('Padaria Sol')).toBeTruthy()
  expect(within(grid).getByText(`${LONG}…`)).toBeTruthy()
  expect(within(grid).getByLabelText('sem valor').textContent).toBe('—')
  expect(screen.getByRole('link', { name: /^clientes/ }).getAttribute('aria-current')).toBe('page')
  expect(screen.queryByRole('link', { name: /Primeira página/ })).toBeNull()
  const more = screen.getByRole('link', { name: 'Ver mais: clientes' })
  expect(more.getAttribute('href')).toBe(`${PROJECT}/data/clientes?page=NTA`)
  fireEvent.click(more)
  expect(await screen.findByText('Loja Mar')).toBeTruthy()
  expect(asked.at(-1)).toEqual({ table: 'clientes', page: 'NTA' })
  expect(screen.queryByRole('link', { name: /Ver mais/ })).toBeNull()
  const first = screen.getByRole('link', { name: 'Primeira página: clientes' })
  expect(first.getAttribute('href')).toBe(`${PROJECT}/data/clientes`)
  fireEvent.click(first)
  expect(await screen.findByText('Padaria Sol')).toBeTruthy()
})

test('Dados: as linhas em páginas, abrir o endereço com a página mostra a mesma página', async () => {
  open(`${PROJECT}/data/clientes?page=NTA`, { tables: () => TABLES, rows: rowsOf })
  expect(await screen.findByText('Loja Mar')).toBeTruthy()
  expect(asked).toEqual([{ table: 'clientes', page: 'NTA' }])
  expect(screen.queryByText('Padaria Sol')).toBeNull()
})

test('Dados: tabela vazia e tabela que não existe', async () => {
  open(`${PROJECT}/data/metas`, { tables: () => TABLES, rows: rowsOf })
  const grid = await screen.findByRole('table')
  expect(
    within(grid)
      .getAllByRole('columnheader')
      .map((head) => head.textContent),
  ).toEqual(['id', 'meta'])
  expect(screen.getByText('Esta tabela ainda não tem linhas.')).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: /^clientes/ }))
  expect(await screen.findByText('Padaria Sol')).toBeTruthy()
})

test('Dados: tabela vazia e tabela que não existe, a lista fica ao lado', async () => {
  open(`${PROJECT}/data/fantasma`, { tables: () => TABLES, rows: rowsOf })
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Tabelas' })).toBeTruthy()
  expect(screen.getByRole('link', { name: /^clientes/ })).toBeTruthy()
})

test('Dados: o banco do app não respondeu', async () => {
  let down = true
  open(`${PROJECT}/data/clientes`, {
    tables: () => TABLES,
    rows: async (table, page) => {
      if (!down) return rowsOf(table, page)
      await delay(500)
      return refusal('APP_DATABASE_UNAVAILABLE')
    },
  })
  const list = await screen.findByRole('navigation', { name: 'Tabelas' })
  // While the rows load, only their area is a skeleton: the list stays.
  expect(await screen.findByRole('status', { name: 'Carregando' })).toBeTruthy()
  expect(within(list).getByRole('link', { name: /^clientes/ })).toBeTruthy()
  expect(
    await screen.findByText('O banco do app não respondeu. Tente de novo em instantes.'),
  ).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Tabelas' })).toBeTruthy()
  down = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByText('Padaria Sol')).toBeTruthy()
})

test('Dados: o banco do app não respondeu, uma tabela larga demais não tem o que tentar de novo', async () => {
  open(`${PROJECT}/data/clientes`, {
    tables: () => TABLES,
    rows: () => refusal('APP_TABLE_TOO_WIDE'),
  })
  expect(
    await screen.findByText(
      'Esta tabela tem colunas demais para mostrar aqui. Peça ao Builder o que você quer ver dela.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(screen.getByRole('navigation', { name: 'Tabelas' })).toBeTruthy()
})

test('Dados: a lista, o banco do app não respondeu', async () => {
  let down = true
  open(`${PROJECT}/data`, {
    tables: () => (down ? refusal('APP_DATABASE_UNAVAILABLE') : TABLES),
  })
  expect(
    await screen.findByText('O banco do app não respondeu. Tente de novo em instantes.'),
  ).toBeTruthy()
  down = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('navigation', { name: 'Tabelas' })).toBeTruthy()
})

function onPhone() {
  vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
}

test('Dados: no celular, a lista sozinha e, numa tabela, só as linhas com a volta', async () => {
  onPhone()
  try {
    open(`${PROJECT}/data`, { tables: () => TABLES, rows: rowsOf })
    expect(await screen.findByRole('navigation', { name: 'Tabelas' })).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: /^clientes/ }))
    expect(await screen.findByRole('table')).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Tabelas' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Dados' })).toBeNull()
    fireEvent.click(screen.getByRole('link', { name: '‹ Tabelas' }))
    expect(await screen.findByRole('navigation', { name: 'Tabelas' })).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('table')).toBeNull())
  } finally {
    vi.restoreAllMocks()
  }
})
