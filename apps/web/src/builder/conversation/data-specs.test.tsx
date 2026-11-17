import { DATA_TOOL, DataResult } from '@conexus/hub-api'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { REFUSED_TEXT } from './data-specs.ts'
import { ASSISTANT_ROOM, BUILDER_ROOM, RoomContext } from './room.ts'
import type { ToolItem } from './rows.ts'
import { invocationToItem } from './rows.ts'
import { DataPart, recordedPart } from './test-recorded.ts'
import { ToolRow } from './tool-row.tsx'

const SQL =
  'select sum("VLRNOTA") as total from sync.vendas where "DTNEG" >= \'2026-10-01\''

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
  vi.restoreAllMocks()
})

function recorded(toolName: string) {
  return recordedPart('data-query', DataPart, (part) => part.toolInvocation.toolName === toolName)
    .toolInvocation
}

function itemOf(inv: Parameters<typeof invocationToItem>[0]): ToolItem {
  const item = invocationToItem(inv, undefined)
  if (item?.kind !== 'tool') throw new Error(`${inv.toolName} is not a row`)
  return item
}

function catalog() {
  const inv = recorded(DATA_TOOL.describe)
  return { inv, result: DataResult.parse(inv.result) }
}

function table() {
  return recordedPart('data-query', DataPart, (part) => 'table' in part.toolInvocation.args)
    .toolInvocation
}

function query() {
  const inv = recorded(DATA_TOOL.query)
  return { inv, result: DataResult.parse(inv.result) }
}

function running(inv: ReturnType<typeof recorded>) {
  const { result: _result, ...call } = inv
  return { ...call, state: 'call' as const }
}

function thrown(inv: ReturnType<typeof recorded>, kind: string) {
  const { result: _result, ...call } = inv
  const errorText = JSON.stringify({ kind, status: null, body: null, code: null, message: null })
  return { ...call, state: 'output-error' as const, errorText }
}

function draw(tool: ToolItem, room = BUILDER_ROOM) {
  return render(
    <RoomContext.Provider value={room}>
      <ToolRow tool={tool} />
    </RoomContext.Provider>,
  )
}

test('o catálogo: Consultou o catálogo, 5 tabelas', () => {
  draw(itemOf(catalog().inv))
  expect(screen.getByText('Consultou o catálogo')).toBeTruthy()
  expect(screen.getByText('5 tabelas')).toBeTruthy()
})

test('o catálogo com uma tabela diz "1 tabela", e rodando diz Consultando o catálogo', () => {
  const { inv, result } = catalog()
  if (result.kind !== 'CATALOG') throw new Error('the recording holds no catalog')
  const one = draw(itemOf({ ...inv, result: { ...result, tables: result.tables.slice(0, 1) } }))
  expect(screen.getByText('1 tabela')).toBeTruthy()
  one.unmount()
  draw(itemOf(running(inv)))
  expect(screen.getByText('Consultando o catálogo')).toBeTruthy()
})

test('o catálogo: a chamada em erro ou negada diz que não conseguiu ler o catálogo', () => {
  const { inv } = catalog()
  const { result: _result, ...call } = inv
  const failed = draw(itemOf({ ...call, state: 'output-error', errorText: 'falhou' }))
  expect(screen.getByText('Não conseguiu ler o catálogo agora.')).toBeTruthy()
  failed.unmount()
  draw({ ...itemOf(running(inv)), state: 'output-denied' })
  expect(screen.getByText('Não conseguiu ler o catálogo agora.')).toBeTruthy()
})

test('a amostra: Viu vendas, 5 linhas, há mais', () => {
  const inv = table()
  draw(itemOf(inv))
  expect(screen.getByText('Viu vendas')).toBeTruthy()
  expect(screen.getByText('5 linhas, há mais')).toBeTruthy()
})

test('a amostra: rodando diz Vendo, e uma amostra sem mais linhas não diz "há mais"', () => {
  const inv = table()
  const result = DataResult.parse(inv.result)
  if (result.kind !== 'TABLE') throw new Error('the recording holds no table')
  const done = draw(
    itemOf({ ...inv, result: { ...result, sample: { ...result.sample, more: false } } }),
  )
  expect(screen.getByText('5 linhas')).toBeTruthy()
  done.unmount()
  const empty = draw(itemOf({ ...inv, result: { ...result, sample: { rows: [], more: false } } }))
  expect(screen.getByText('Nenhuma linha.')).toBeTruthy()
  empty.unmount()
  draw(itemOf(running(inv)))
  expect(screen.getByText('Vendo vendas')).toBeTruthy()
})

test('rodando: Consultando os dados', () => {
  draw(itemOf(running(query().inv)))
  expect(screen.getByText('Consultando os dados')).toBeTruthy()
})

test('a consulta: Consultou vendas, 1 linha', () => {
  draw(itemOf(query().inv))
  expect(screen.getByText('Consultou vendas')).toBeTruthy()
  expect(screen.getByText('1 linha')).toBeTruthy()
})

test('a consulta: n linhas, há mais quando não veio completa, e duas tabelas juntas', () => {
  const { inv, result } = query()
  if (result.kind !== 'ROWS') throw new Error('the recording holds no rows')
  const [origin] = result.origin
  if (origin === undefined) throw new Error('the recording holds no origin')
  draw(
    itemOf({
      ...inv,
      result: {
        ...result,
        rows: [[1], [2], [3]],
        complete: false,
        origin: [origin, { ...origin, table: 'sankhya_clientes' }],
      },
    }),
  )
  expect(screen.getByText('Consultou vendas, sankhya_clientes')).toBeTruthy()
  expect(screen.getByText('3 linhas, há mais')).toBeTruthy()
})

test('um resultado fora do esquema dá a linha genérica', () => {
  const { inv } = query()
  draw(itemOf({ ...inv, result: { kind: 'ROWS', rows: 'não é uma lista' } }))
  expect(screen.getByText('Consultou os dados')).toBeTruthy()
  expect(screen.queryByText(/linha/)).toBeNull()
})

test.each(Object.entries(REFUSED_TEXT))('cada recusa diz o seu texto: %s', (kind, text) => {
  const inv = thrown(query().inv, kind)
  const stored = draw(itemOf(inv))
  expect(screen.getByText(text)).toBeTruthy()
  expect(screen.queryByText('Consultou os dados')).toBeNull()
  stored.unmount()
  const { errorText, ...call } = inv
  draw(itemOf({ ...call, state: 'result', result: errorText, isError: true }))
  expect(screen.getByText(text)).toBeTruthy()
})

test('a consulta recusada pelo banco diz que a tabela não está no catálogo', () => {
  draw(itemOf(thrown(query().inv, 'NOT_IN_ROLE')))
  expect(screen.getByText('Essa tabela não está no catálogo.')).toBeTruthy()
  expect(screen.queryByText(/papel/)).toBeNull()
})

test('a recusa da amostra de uma tabela diz o texto da tabela', () => {
  draw(itemOf(thrown(table(), 'NOT_IN_ROLE')))
  expect(screen.getByText('Essa tabela não está no catálogo.')).toBeTruthy()
})

test('um kind fora da lista, ou um erro que não é o JSON das ferramentas, cai na linha genérica', () => {
  const { inv } = query()
  const unknown = draw(itemOf(thrown(inv, 'OUTRA_RECUSA')))
  expect(screen.getByText('Não conseguiu ler a tabela agora.')).toBeTruthy()
  unknown.unmount()
  const text = draw(itemOf({ ...thrown(inv, 'x'), errorText: 'Error: boom' }))
  expect(screen.getByText('Não conseguiu ler a tabela agora.')).toBeTruthy()
  text.unmount()
  draw(itemOf(thrown(inv, 'toString')))
  expect(screen.getByText('Não conseguiu ler a tabela agora.')).toBeTruthy()
})

function textsIn(rows: ToolItem[], room: typeof BUILDER_ROOM) {
  return rows.map((row) => {
    const view = draw(row, room)
    const said = view.container.textContent
    view.unmount()
    return said
  })
}

test('na sala do Builder, as mesmas linhas', () => {
  const rows = [itemOf(catalog().inv), itemOf(table()), itemOf(query().inv)]
  expect(textsIn(rows, BUILDER_ROOM)).toEqual(textsIn(rows, ASSISTANT_ROOM))
  expect(textsIn(rows, BUILDER_ROOM)).toEqual([
    'Consultou o catálogo5 tabelas',
    'Viu vendas5 linhas, há mais',
    'Consultou vendas1 linha',
  ])
})

function clipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
}

test('aberta, a linha mostra a consulta e Copiar a consulta põe o texto na área de transferência', async () => {
  const sql = `select ${'"VLRNOTA", '.repeat(100)}1 from sync.vendas`
  expect(sql.length).toBeGreaterThan(800)
  const writeText = vi.fn(() => Promise.resolve())
  clipboard(writeText)
  const { inv } = query()
  draw(itemOf({ ...inv, args: { sql } }))
  expect(screen.queryByText('Copiar a consulta')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /Consultou vendas/ }))
  expect(screen.getByText(sql)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Copiar a consulta' }))
  expect(await screen.findByRole('button', { name: 'Consulta copiada' })).toBeTruthy()
  expect(writeText).toHaveBeenCalledExactlyOnceWith(sql)
})

test.each([
  ['a escrita recusada', true],
  ['sem área de transferência', false],
])('a cópia recusada diz para selecionar: %s', async (_name, hasClipboard) => {
  const cause = new Error('negado')
  const log = vi.spyOn(console, 'error').mockReturnValue(undefined)
  if (hasClipboard) clipboard(() => Promise.reject(cause))
  draw(itemOf({ ...query().inv, args: { sql: SQL } }))
  fireEvent.click(screen.getByRole('button', { name: /Consultou vendas/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Copiar a consulta' }))
  expect(await screen.findByText('Não deu para copiar. Selecione a consulta e copie.')).toBeTruthy()
  await waitFor(() =>
    expect(log).toHaveBeenCalledWith('QUERY_NOT_COPIED', hasClipboard ? cause : expect.any(Error)),
  )
  expect(screen.getByRole('button', { name: 'Copiar a consulta' })).toBeTruthy()
})

test('a tabela pedida: NOT_IN_CATALOG diz que não está no catálogo, e o erro sem kind conhecido diz que não leu a tabela', () => {
  const inv = table()
  const missing = draw(itemOf(thrown(inv, 'NOT_IN_CATALOG')))
  expect(screen.getByText('Essa tabela não está no catálogo.')).toBeTruthy()
  missing.unmount()
  const { result: _result, ...call } = inv
  draw(itemOf({ ...call, state: 'output-error', errorText: 'falhou' }))
  expect(screen.getByText('Não conseguiu ler a tabela agora.')).toBeTruthy()
})
