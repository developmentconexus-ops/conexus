import type { AppRows, AppTables } from '@conexus/hub-api'
import { AppRows as RowsShape, AppTables as TablesShape } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { conversationsNone, refusal } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'
import { asked, EMPTY, open, PROJECT, rowsOf, server, TABLES } from './test-data.tsx'

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

const WITH_COPIES: AppTables = TablesShape.parse({
  kind: 'TABLES',
  tables: [
    ...(TABLES.kind === 'TABLES' ? TABLES.tables.slice(0, 2) : []),
    { schema: 'COPY', name: 'clientes', rows: { kind: 'OVER' } },
    { schema: 'COPY', name: 'vendas', rows: { kind: 'EXACT', rows: 183 } },
  ],
})
const SALES: AppRows = RowsShape.parse({
  columns: [{ name: 'codigo' }, { name: 'valor' }],
  rows: [
    [
      { text: '7', cut: false },
      { text: '12.50', cut: false },
    ],
  ],
  next: { kind: 'END' },
})

function copyRowsOf(table: string) {
  if (table === 'vendas') return SALES
  if (table === 'novas') return EMPTY
  return refusal('NOT_FOUND')
}

test('Dados: as cópias liberadas', async () => {
  open(`${PROJECT}/data`, { tables: () => WITH_COPIES, rows: rowsOf, copyRows: copyRowsOf })
  const app = within(await screen.findByRole('region', { name: 'Tabelas do app' }))
  expect(app.getAllByRole('link').map((link) => link.textContent)).toEqual([
    'anotacoes37',
    'clientes1.284',
  ])
  const copies = within(screen.getByRole('region', { name: 'Cópias liberadas' }))
  expect(copies.getAllByRole('link').map((link) => link.textContent)).toEqual([
    'clientesmais de 10.000 (teto da contagem)',
    'vendas183',
  ])
  expect(copies.getByRole('link', { name: /^vendas/ }).getAttribute('href')).toBe(
    `${PROJECT}/data/copies/vendas`,
  )
  expect(app.getByRole('link', { name: /^clientes/ }).getAttribute('href')).toBe(
    `${PROJECT}/data/clientes`,
  )
  fireEvent.click(copies.getByRole('link', { name: /^vendas/ }))
  const grid = await screen.findByRole('table')
  expect(
    within(grid)
      .getAllByRole('columnheader')
      .map((head) => head.textContent),
  ).toEqual(['codigo', 'valor'])
  expect(within(grid).getByText('12.50')).toBeTruthy()
  expect(asked.at(-1)).toEqual({ table: 'copia:vendas', page: null })
  expect(screen.getByRole('link', { name: /^vendas/ }).getAttribute('aria-current')).toBe('page')
  expect(
    screen.getByRole('link', { name: /^clientes1\.284/ }).getAttribute('aria-current'),
  ).toBeNull()
})

test('Dados: as cópias liberadas, uma cópia sem linhas e uma que não existe', async () => {
  open(`${PROJECT}/data/copies/novas`, {
    tables: () => WITH_COPIES,
    rows: rowsOf,
    copyRows: copyRowsOf,
  })
  expect(await screen.findByText('Esta cópia ainda não tem linhas.')).toBeTruthy()
  expect(screen.queryByText('Esta tabela ainda não tem linhas.')).toBeNull()
})

test('Dados: as cópias liberadas, uma cópia não liberada é não encontrada com a lista ao lado', async () => {
  open(`${PROJECT}/data/copies/fantasma`, {
    tables: () => WITH_COPIES,
    rows: rowsOf,
    copyRows: copyRowsOf,
  })
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Cópias liberadas' })).toBeTruthy()
})

test('Dados: um Projeto sem cópia liberada não mostra a seção', async () => {
  open(`${PROJECT}/data`, { tables: () => TABLES })
  await screen.findByRole('region', { name: 'Tabelas do app' })
  expect(screen.queryByRole('region', { name: 'Cópias liberadas' })).toBeNull()
})

test('Dados: um Projeto com cópia liberada e app sem tabelas', async () => {
  const only = TablesShape.parse({
    kind: 'TABLES',
    tables: [{ schema: 'COPY', name: 'vendas', rows: { kind: 'EXACT', rows: 1 } }],
  })
  open(`${PROJECT}/data`, { tables: () => only })
  const app = within(await screen.findByRole('region', { name: 'Tabelas do app' }))
  expect(app.getByText('O app ainda não criou tabelas.')).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Cópias liberadas' })).toBeTruthy()
})
