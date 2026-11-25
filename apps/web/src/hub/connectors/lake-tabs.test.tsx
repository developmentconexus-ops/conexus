import type { LakeTablesOfConnection } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE } from './fixtures.ts'
import { copiedLake, NO_LAKE, RUNNING_ROUND, readyLake } from './lake-fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { choose, connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const MATRIZ = connectionOf({ name: 'Matriz', state: 'ACTIVE' })

/** The connection's page on a Hub that holds `fields`, with the tab "Tabelas" open when it has one. */
async function openTables(fields: Partial<View> = {}, answers: Answers = {}) {
  const view = viewOf({ connections: [MATRIZ], ...fields })
  const hub = connectionsHub(view, answers)
  server.use(...hub.handlers)
  mount(pageOf(MATRIZ))
  fireEvent.click(await screen.findByRole('tab', { name: 'Tabelas' }))
  return {
    view,
    sent: hub.sent,
    section: await screen.findByRole('region', { name: 'Tabelas no lago' }),
  }
}

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
