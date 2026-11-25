import { ConnectionId } from '@conexus/hub-api'
import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { connection, LIST, lakeTable, openData } from './test-hub.tsx'

const server = hubServer()

const SANKHYA = connection()
const LOJA = connection({
  id: ConnectionId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  connector: 'mercado-livre',
  name: 'Loja A',
})
const CRM = connection({
  id: ConnectionId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
  connector: 'hubspot',
  name: 'Comercial',
})
const NO_COPY_PHRASE = 'Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'

async function open(held: Parameters<typeof openData>[1]) {
  openData(server, held, LIST)
  const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
  return { nav, main: within(screen.getByRole('main')) }
}

test('Dados: o Mercado Livre e o HubSpot, que o servidor diz que não copiam, ficam fora; o Sankhya fica', async () => {
  const { nav, main } = await open({ connections: [SANKHYA, LOJA, CRM] })
  expect(await main.findByText('Matriz · Lago')).toBeTruthy()
  expect(main.queryByText(/Loja A/)).toBeNull()
  expect(main.queryByText(/Comercial/)).toBeNull()
  expect(main.getAllByText(NO_COPY_PHRASE)).toHaveLength(1)
  expect(await nav.findByText(NO_COPY_PHRASE)).toBeTruthy()
})

test('Dados: só ligações que não copiam dizem que não há sistema, na página e na árvore', async () => {
  const { nav, main } = await open({ connections: [LOJA, CRM] })
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(main.queryByText(NO_COPY_PHRASE)).toBeNull()
  expect(await nav.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(nav.queryByText(NO_COPY_PHRASE)).toBeNull()
})

test('Dados: uma ligação parada que ainda tem tabela no lago segue em Dados', async () => {
  const stopped = connection({ state: 'NEEDS_REAUTH' })
  const { main } = await open({ connections: [stopped, LOJA], tables: [lakeTable()] })
  expect(await main.findByText(/^Matriz · Lago · 1 tabela/)).toBeTruthy()
  expect(main.getByText('Notas e pedidos')).toBeTruthy()
  expect(main.queryByText(/Loja A/)).toBeNull()
})

test('Dados: uma ligação que pode copiar, mas está parada e sem tabela, sai de Dados', async () => {
  const { main } = await open({ connections: [connection({ state: 'NEEDS_REAUTH' })] })
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
})
