import { ConnectionId } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connection, LIST, lakeRun, lakeTable, openData } from './test-hub.tsx'

// Dados, the lake's tables grouped by the connection that copies them (criterion 55).
const server = hubServer()

const FISCAL = '33333333-3333-4333-8333-333333333333'
const FILIAL = ConnectionId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const NFE = lakeTable({
  id: FISCAL,
  name: 'sankhya_notas_nfe',
  label: 'Dados da NF-e',
  source: 'TGFNFE',
  mode: { kind: 'FULL' },
  rows: 9210,
})

async function list() {
  await screen.findByRole('navigation', { name: 'Dados' })
  return within(screen.getByRole('main'))
}

test('Dados mostra a tabela pelo rótulo, com o nome no lago e "<sistema> · <origem>" embaixo, e Em dia (critério 55)', async () => {
  openData(server, { tables: [lakeTable(), NFE] }, LIST)
  const main = await list()
  const label = await main.findByRole('link', { name: 'Notas e pedidos' })
  expect(label.getAttribute('href')).toBe(`${LIST}/lake/11111111-1111-4111-8111-111111111111`)
  expect(main.queryByRole('link', { name: 'sankhya_notas' })).toBeNull()
  const row = label.closest('tr')
  if (row === null) throw new Error('the row of the table')
  expect(row.textContent).toContain('sankhya_notas · Sankhya · TGFCAB')
  expect(within(row).getByText('Em dia')).toBeTruthy()
  expect(within(row).getByText('02/11 10:02')).toBeTruthy()
  expect(within(row).getByText('118.402')).toBeTruthy()
  expect(within(row).getByText('24 h')).toBeTruthy()
  expect(main.getByText('Matriz · Lago · 2 tabelas')).toBeTruthy()
  expect(main.getByRole('link', { name: 'Dados da NF-e' })).toBeTruthy()
})

test('com duas ligações do mesmo sistema, cada ligação é um grupo com o nome dela e as tabelas dela', async () => {
  const other = lakeTable({
    id: FISCAL,
    connection: { id: FILIAL, name: 'Filial', connector: 'sankhya' },
    name: 'filial_notas',
  })
  openData(
    server,
    {
      connections: [connection(), connection({ id: FILIAL, name: 'Filial' })],
      tables: [lakeTable(), other],
    },
    LIST,
  )
  const main = await list()
  expect(await main.findByText('Matriz · Lago · 1 tabela')).toBeTruthy()
  expect(main.getByText('Filial · Lago · 1 tabela')).toBeTruthy()
  expect(main.queryByText(/Sankhya · .*Lago/)).toBeNull()
  const matriz = main.getByRole('table', { name: 'Matriz' })
  const filial = main.getByRole('table', { name: 'Filial' })
  expect(within(filial).getByText(/filial_notas/)).toBeTruthy()
  expect(within(filial).queryByText(/sankhya_notas/)).toBeNull()
  expect(within(matriz).getByText(/sankhya_notas/)).toBeTruthy()
  expect(within(matriz).queryByText(/filial_notas/)).toBeNull()
})

test('a ligação de nome igual ao do sistema não repete o sistema no título do grupo', async () => {
  openData(
    server,
    {
      connections: [connection({ name: 'Sankhya' })],
      tables: [
        lakeTable({ connection: { id: connection().id, name: 'Sankhya', connector: 'sankhya' } }),
      ],
    },
    LIST,
  )
  const main = await list()
  expect(await main.findByText('Sankhya · Lago · 1 tabela')).toBeTruthy()
})

test('uma rodada aberta diz Rodando… e sem hora; a com erro diz Com erro e a frase do código; a interrompida diz Interrompida.', async () => {
  const running = lakeTable({ lastRun: lakeRun({ outcome: 'RUNNING', endedAt: undefined }) })
  const failed = lakeTable({
    id: FISCAL,
    label: 'Dados da NF-e',
    name: 'sankhya_notas_nfe',
    lastRun: lakeRun({
      outcome: 'ERROR',
      code: 'COPY_SOURCE_UNREACHABLE',
      failedTable: 'sankhya_notas_nfe',
      system: null,
    }),
  })
  openData(server, { tables: [running, failed] }, LIST)
  const main = await list()
  const first = (await main.findByRole('link', { name: 'Notas e pedidos' })).closest('tr')
  const second = main.getByRole('link', { name: 'Dados da NF-e' }).closest('tr')
  if (first === null || second === null) throw new Error('the rows')
  expect(within(first).getByText('Rodando…')).toBeTruthy()
  expect(first.textContent).not.toContain('02/11')
  expect(within(second).getByText('Com erro')).toBeTruthy()
  expect(
    within(second).getByText('Sankhya não respondeu. A próxima rodada tenta de novo.'),
  ).toBeTruthy()
})

test('a rodada interrompida diz Interrompida. na lista', async () => {
  openData(server, { tables: [lakeTable({ lastRun: lakeRun({ outcome: 'INTERRUPTED' }) })] }, LIST)
  const main = await list()
  expect(await main.findByText('Interrompida.')).toBeTruthy()
})

test('um sistema sem tabela no lago diz a frase da matriz ao lado do que tem', async () => {
  openData(
    server,
    {
      connections: [connection(), connection({ id: FILIAL, name: 'Loja A' })],
      tables: [lakeTable()],
    },
    LIST,
  )
  const main = await list()
  expect(await main.findByText('Matriz · Lago · 1 tabela')).toBeTruthy()
  expect(main.getByText('Loja A · Lago')).toBeTruthy()
  expect(
    main.getAllByText('Nenhuma tabela copiada. Escolha o que copiar na página da ligação.'),
  ).toHaveLength(1)
})

test('a árvore conta as tabelas do lago em Copiado e diz quantas são', async () => {
  openData(server, { tables: [lakeTable(), NFE] }, LIST)
  const nav = within(await screen.findByRole('navigation', { name: 'Dados' }))
  expect(await nav.findByRole('link', { name: 'Copiado 2' })).toBeTruthy()
  expect(nav.getByText('2 tabelas no lago')).toBeTruthy()
})

test('a falha de ler as tabelas do lago diz a frase de hoje e Tentar de novo lê outra vez', async () => {
  let fail = true
  openData(
    server,
    {
      tables: [lakeTable()],
      lakeAnswer: () => (fail ? refusal('DATABASE_UNAVAILABLE') : undefined),
    },
    LIST,
  )
  const main = await list()
  const alert = await main.findByRole('alert')
  expect(alert.textContent).toBe(
    'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.',
  )
  fail = false
  fireEvent.click(main.getByRole('button', { name: 'Tentar de novo' }))
  expect(await main.findByRole('link', { name: 'Notas e pedidos' })).toBeTruthy()
})

test('quem não gerencia cópias não vê a lista do lago nem a lê', async () => {
  const asked: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (request.url.includes('/lake-tables')) asked.push(request.url)
  })
  openData(server, { tables: [lakeTable()] }, LIST, 'member')
  const main = await list()
  expect(await main.findByText(/Seu papel ainda não lê nenhuma tabela/)).toBeTruthy()
  expect(main.queryByRole('link', { name: 'Notas e pedidos' })).toBeNull()
  expect(asked).toEqual([])
})
