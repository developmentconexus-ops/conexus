import type { LakeTablesOfConnection } from '@conexus/hub-api'
import { screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE } from './fixtures.ts'
import { copiedLake, NO_LAKE } from './lake-fixtures.ts'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'
import { MATRIZ } from './test-lake.tsx'

const server = hubServer()

const COPIED = ['TGFCAB', 'TGFITE']
function lake(fields: Partial<LakeTablesOfConnection> = {}) {
  return copiedLake(COPIED, { startDate: '2021-11-24', ...fields })
}

test('a página do Sankhya tem as abas Visão geral (a padrão, com os fatos e o Caderno) e Tabelas; os outros sistemas seguem sem abas', async () => {
  const view = viewOf({ connections: [MATRIZ], lake: lake() })
  server.use(...connectionsHub(view).handlers)
  mount(pageOf(MATRIZ))
  expect(await screen.findByRole('tab', { name: 'Tabelas' })).toBeTruthy()
  expect(screen.getByRole('tab', { name: 'Visão geral' }).getAttribute('aria-selected')).toBe(
    'true',
  )
  expect(screen.getByRole('region', { name: 'A ligação' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Caderno' })).toBeTruthy()
})

test('uma ligação de outro sistema não tem abas nem a seção', async () => {
  const other = connectionOf({ connector: 'mercado-livre', name: 'Loja', state: 'ACTIVE' })
  const view = viewOf({ connections: [other], connectors: [MERCADO_LIVRE], lake: NO_LAKE })
  let reads = 0
  server.use(
    http.get('*/api/companies/*/connections/*/lake-tables', () => {
      reads += 1
      return undefined
    }),
    ...connectionsHub(view).handlers,
  )
  mount(pageOf(other))
  expect(await screen.findByRole('heading', { name: 'Loja' })).toBeTruthy()
  await waitFor(() => expect(reads).toBe(1))
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(screen.getByRole('region', { name: 'Caderno' })).toBeTruthy()
  expect(screen.queryByRole('tab', { name: 'Tabelas' })).toBeNull()
  expect(screen.queryByRole('tab', { name: 'Visão geral' })).toBeNull()
  expect(screen.queryByRole('region', { name: 'Tabelas no lago' })).toBeNull()
})
