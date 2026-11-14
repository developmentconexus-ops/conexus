import type { InventoryView } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import { COUNTS, connectionsHub, INVENTORY, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()

function open(fields: { mayManage?: boolean; inventory?: InventoryView; run?: () => Response }) {
  const connection = connectionOf({ name: 'Matriz', state: 'ACTIVE' })
  const view = viewOf({
    connections: [connection],
    mayManage: fields.mayManage ?? true,
    inventory: fields.inventory,
    inventoryRun: fields.run,
  })
  const hub = connectionsHub(view)
  server.use(...hub.handlers)
  mount(pageOf(connection))
  return view
}

async function block() {
  return within(await screen.findByRole('region', { name: 'Inventário' }))
}

test('o bloco mostra as três contagens e a data, e quem gerencia lê de novo', async () => {
  open({})
  const inventory = await block()
  expect(
    inventory.getByText(
      /Inventário: 812 tabelas, 9\.310 campos, 2\.140 códigos, lido em 12\/11 às \d{2}:\d{2}/,
    ),
  ).toBeTruthy()
  expect(inventory.getByRole('button', { name: 'Ler de novo' })).toBeTruthy()
})

test('quem não gerencia as ligações vê o resumo, sem Ler de novo', async () => {
  open({ mayManage: false })
  const inventory = await block()
  expect(inventory.getByText(/Inventário: 812 tabelas/)).toBeTruthy()
  expect(inventory.queryByRole('button', { name: 'Ler de novo' })).toBeNull()
})

test('a primeira rodada corre: "Lendo o inventário…", e o botão espera', async () => {
  open({ inventory: { inventory: null, last: null, running: true, mayRun: true } })
  const inventory = await block()
  expect(inventory.getByText('Lendo o inventário…')).toBeTruthy()
  expect(inventory.getByRole('button', { name: 'Ler de novo' })).toHaveProperty('disabled', true)
})

test('nenhuma rodada ainda: sem frase de falha, e quem gerencia lê', async () => {
  open({ inventory: { inventory: null, last: null, running: false, mayRun: true } })
  const inventory = await block()
  expect(inventory.getByRole('button', { name: 'Ler de novo' })).toHaveProperty('disabled', false)
  expect(inventory.queryByText('Não foi possível ler o inventário.')).toBeNull()
  expect(inventory.queryByText('Lendo o inventário…')).toBeNull()
})

test('um conector sem dicionário diz quantas leituras declara', async () => {
  open({
    inventory: {
      ...INVENTORY,
      inventory: { ...COUNTS, tables: 0, fields: 0, codes: 0, operations: 12 },
    },
  })
  expect((await block()).getByText('Inventário: 12 leituras declaradas')).toBeTruthy()
})

test('a rodada que falhou diz, e o inventário anterior continua; parcial diz o limite', async () => {
  open({ inventory: { ...INVENTORY, last: { outcome: 'FAILED', reason: 'REFUSED' } } })
  const failed = await block()
  expect(failed.getByText('Não foi possível ler o inventário.')).toBeTruthy()
  expect(failed.getByText(/Inventário: 812 tabelas/)).toBeTruthy()
  expect(failed.getByRole('button', { name: 'Ler de novo' })).toBeTruthy()
})

test('uma leitura parcial diz que parou no limite', async () => {
  open({
    inventory: {
      ...INVENTORY,
      inventory: { ...COUNTS, outcome: 'PARTIAL', reason: 'CAP' },
      last: { outcome: 'PARTIAL', reason: 'CAP' },
    },
  })
  expect((await block()).getByText('Inventário parcial: lido até o limite.')).toBeTruthy()
})

test('Ler de novo envia o pedido; uma rodada que já corre responde a frase do Hub', async () => {
  let asked = 0
  open({
    run: () => {
      asked += 1
      return refusal('INVENTORY_RUNNING')
    },
  })
  fireEvent.click((await block()).getByRole('button', { name: 'Ler de novo' }))
  await waitFor(() => expect(asked).toBe(1))
  expect(await screen.findByText(/O inventário desta conexão já está sendo lido\./)).toBeTruthy()
})
