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

test('a seção: as tabelas copiadas com o nome fixo, o intervalo, a última rodada e Rodar agora', async () => {
  const { section } = await openTables({ lake: lake() })
  const view = within(section)
  expect(view.getByText('Notas e pedidos')).toBeTruthy()
  expect(view.getByText('sankhya_tgfcab')).toBeTruthy()
  expect(view.getAllByText('Em dia')).toHaveLength(2)
  expect(view.getByRole('combobox', { name: 'Intervalo' }).textContent).toContain('24 h')
  expect(view.getByText(/^Última rodada /)).toBeTruthy()
  expect(view.getByRole('button', { name: 'Rodar agora' })).toBeTruthy()
  expect(view.getByText('As linhas ficam no lago da empresa.')).toBeTruthy()
  expect(view.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true)
  expect(view.queryByText('Parceiros')).toBeNull()
})

test('a seção: as tabelas copiadas ficam sob o assunto, com o número de colunas e a nota de que o nome não muda mais', async () => {
  const marked = copiedLake(['TGFCAB', 'TGFITE', 'TGFNFE'])
  const { section } = await openTables({ lake: marked })
  const view = within(section)
  const vendas = within(view.getByRole('region', { name: 'Vendas' }))
  expect(vendas.getByText('Notas e pedidos')).toBeTruthy()
  expect(vendas.getByText('Itens das notas')).toBeTruthy()
  expect(vendas.queryByText('Dados da NF-e')).toBeNull()
  expect(vendas.getByText('TGFCAB · 12 colunas')).toBeTruthy()
  expect(vendas.getAllByText('· o nome não muda mais')).toHaveLength(2)
  const financeiro = within(view.getByRole('region', { name: 'Financeiro' }))
  expect(financeiro.getByText('Dados da NF-e')).toBeTruthy()
  expect(financeiro.getByText('TGFNFE · 12 colunas')).toBeTruthy()
  expect(view.queryByRole('checkbox', { name: /^Marcar o grupo/ })).toBeNull()
})

test('a seção: com o dicionário fora a tabela copiada não ganha número de colunas', async () => {
  const dark = copiedLake(['TGFCAB']).tables.map((one) => ({ ...one, columns: null }))
  const { section } = await openTables({ lake: copiedLake(['TGFCAB'], { tables: dark }) })
  const view = within(section)
  expect(view.getByText('TGFCAB')).toBeTruthy()
  expect(view.queryByText(/colunas/)).toBeNull()
})

test('a seção: marcar outra mostra o nome sugerido, que se troca; Salvar grava num pedido só com os nomes que não mudam', async () => {
  const { section, sent } = await openTables({ lake: lake() })
  fireEvent.click(within(section).getByRole('button', { name: /^Outras tabelas do Sankhya \(2\)/ }))
  fireEvent.click(await within(section).findByRole('checkbox', { name: 'Parceiros' }))
  const name = within(section).getByLabelText<HTMLInputElement>('Nome no lago: Parceiros')
  expect(name.value).toBe('tgfpar')
  fireEvent.change(name, { target: { value: 'clientes' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(await within(section).findByText('sankhya_clientes')).toBeTruthy()
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(1)
  expect(sent.find((one) => one.method === 'PUT')?.body).toEqual({
    tables: [
      { source: 'TGFCAB', name: 'sankhya_tgfcab' },
      { source: 'TGFITE', name: 'sankhya_tgfite' },
      { source: 'TGFPAR', name: 'sankhya_clientes' },
    ],
    interval: '24h',
    startDate: '2021-11-24',
  })
})

test('a seção: desmarcar e mudar o intervalo, Só manual incluído, gravam por Salvar', async () => {
  const { section, sent } = await openTables({ lake: lake() })
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  await choose(within(section).getByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(sent.some((one) => one.method === 'PUT')).toBe(true))
  expect(sent.find((one) => one.method === 'PUT')?.body).toEqual({
    tables: [{ source: 'TGFCAB', name: 'sankhya_tgfcab' }],
    interval: 'MANUAL',
    startDate: '2021-11-24',
  })
  await waitFor(() => expect(within(section).queryByText('Itens das notas')).toBeNull())
})

test('a seção: Rodar agora pede a rodada sem relê-la inteira', async () => {
  const { section, sent } = await openTables({ lake: lake() })
  fireEvent.click(within(section).getByRole('button', { name: 'Rodar agora' }))
  await waitFor(() => expect(sent.some((one) => one.path.endsWith('/lake-copy/run'))).toBe(true))
  expect(sent.find((one) => one.path.endsWith('/lake-copy/run'))?.body).toEqual({ whole: false })
  expect(await within(section).findAllByText('Rodando…')).toHaveLength(2)
})

test('a seção: sem cópia diz que nada é copiado e oferece Escolher o que copiar', async () => {
  const { section } = await openTables({ lake: readyLake() })
  expect(within(section).getByText('Nada desta ligação é copiado para o lago.')).toBeTruthy()
  expect(within(section).getByRole('button', { name: 'Escolher o que copiar' })).toBeTruthy()
})

test('a seção: sem lago pronto diz a frase da matriz e não oferece escolher', async () => {
  const { section } = await openTables({ lake: readyLake({ lake: { kind: 'NOT_READY' } }) })
  expect(
    within(section).getByText('O lago desta empresa não está pronto. Peça ao operador do Conexus.'),
  ).toBeTruthy()
  expect(within(section).queryByRole('button', { name: 'Escolher o que copiar' })).toBeNull()
})

test('a seção: quem não gerencia cópias vê as tabelas sem caixas, sem Salvar, sem Rodar agora e sem Ler de novo', async () => {
  const { section } = await openTables({ role: 'member', mayManage: false, lake: lake() })
  const view = within(section)
  expect(view.getByText('Notas e pedidos')).toBeTruthy()
  expect(view.getByText('sankhya_tgfcab')).toBeTruthy()
  expect(view.queryByRole('checkbox')).toBeNull()
  for (const name of [
    'Salvar',
    'Rodar agora',
    'Ler de novo desde a data',
    'Escolher o que copiar',
  ]) {
    expect(view.queryByRole('button', { name })).toBeNull()
  }
})

test('a seção: a rodada aberta no Hub aparece como Rodando…, e a recusa por rodada aberta diz a frase do código', async () => {
  const running = copiedLake(COPIED, { lastRun: RUNNING_ROUND })
  const { section } = await openTables({ lake: running }, { copy: () => refusal('COPY_RUN_OPEN') })
  expect(within(section).getAllByText('Rodando…')).toHaveLength(2)
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'A ligação está copiando agora. Desmarque quando a rodada terminar.',
    ),
  ).toBeTruthy()
})

test('a data inicial: mostra a data da cópia e, salva uma mais nova, diz que vale da próxima rodada', async () => {
  const { section, sent } = await openTables({ lake: lake() })
  const since = within(section).getByLabelText<HTMLInputElement>('Desde')
  expect(since.value).toBe('2021-11-24')
  fireEvent.change(since, { target: { value: '2022-01-01' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'A data nova vale a partir da próxima rodada. As linhas de antes dela continuam no lago até você ler de novo desde a data.',
    ),
  ).toBeTruthy()
  expect(sent.find((one) => one.method === 'PUT')?.body).toMatchObject({ startDate: '2022-01-01' })
  expect(within(section).getAllByText('Desde 01/01/2022')).toHaveLength(2)
})

test('a data inicial: uma mais antiga, ou vazia, diz que as próximas rodadas seguem de onde pararam e como trazer as linhas', async () => {
  const { section, sent } = await openTables({ lake: lake() })
  const since = within(section).getByLabelText('Desde')
  fireEvent.change(since, { target: { value: '2020-01-01' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'As próximas rodadas continuam de onde pararam. Para trazer as linhas desde 01/01/2020, clique Ler de novo desde a data.',
    ),
  ).toBeTruthy()
  fireEvent.change(since, { target: { value: '' } })
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(
    await within(section).findByText(
      'As próximas rodadas continuam de onde pararam. Para trazer as linhas desde o começo, clique Ler de novo desde a data.',
    ),
  ).toBeTruthy()
  expect(sent.filter((one) => one.method === 'PUT').map((one) => one.body)).toMatchObject([
    { startDate: '2020-01-01' },
    { startDate: null },
  ])
})

test('a data inicial: depois de hoje recusa e desliga Salvar; sem data o campo diz Todo o histórico', async () => {
  const { section, sent } = await openTables({ lake: copiedLake(COPIED) })
  const since = within(section).getByLabelText<HTMLInputElement>('Desde')
  expect(since.value).toBe('')
  fireEvent.change(since, { target: { value: '2999-01-01' } })
  expect(await within(section).findByText('A data não pode ser depois de hoje.')).toBeTruthy()
  expect(within(section).getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(
    true,
  )
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
})

test('a data inicial: quem não gerencia cópias vê a data sem o campo e sem o botão', async () => {
  const { section } = await openTables({ role: 'member', mayManage: false, lake: lake() })
  expect(within(section).getAllByText(/Desde 24\/11\/2021/).length).toBeGreaterThan(0)
  expect(within(section).queryByLabelText('Desde')).toBeNull()
  expect(within(section).queryByRole('button', { name: 'Ler de novo desde a data' })).toBeNull()
})

test('ler de novo desde a data: o diálogo lista as tabelas que a data limita, cada uma com o que o lago troca, e Ler de novo pede whole: true', async () => {
  const { section, sent } = await openTables({
    lake: copiedLake(['TGFCAB', 'TGFITE', 'TGFPAR'], { startDate: '2021-11-24' }),
  })
  fireEvent.click(within(section).getByRole('button', { name: 'Ler de novo desde a data' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Ler de novo desde 24/11/2021?' })
  expect(within(dialog).getByText('O lago troca o que tem destas tabelas:')).toBeTruthy()
  const rows = within(dialog)
    .getAllByRole('listitem')
    .map((one) => one.textContent)
  expect(rows).toEqual([
    'Notas e pedidosSó o que mudou: o que veio antes da data, ou foi apagado no Sankhya, sai do lago.',
    'Itens das notasJanela por mês: trocam-se só os meses desde o mês da data.',
  ])
  expect(within(dialog).getByText('As outras tabelas seguem como sempre.')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Ler de novo' }))
  await waitFor(() => expect(sent.some((one) => one.path.endsWith('/lake-copy/run'))).toBe(true))
  expect(sent.find((one) => one.path.endsWith('/lake-copy/run'))?.body).toEqual({ whole: true })
  expect(await within(section).findAllByText('Rodando…')).toHaveLength(3)
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('ler de novo desde a data: sem data o título diz "desde o começo" e Cancelar não chama nada', async () => {
  const { section, sent } = await openTables({ lake: copiedLake(COPIED) })
  fireEvent.click(within(section).getByRole('button', { name: 'Ler de novo desde a data' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Ler de novo desde o começo?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
})

test('ler de novo desde a data: sem tabela que a data limite o botão não aparece', async () => {
  const { section } = await openTables({
    lake: copiedLake(['TGFPAR', 'TGFNFE'], { startDate: '2021-11-24' }),
  })
  expect(within(section).getByText('Parceiros')).toBeTruthy()
  expect(within(section).queryByRole('button', { name: 'Ler de novo desde a data' })).toBeNull()
})

test('ler de novo desde a data: com a resposta already nada muda e as tabelas seguem Rodando…', async () => {
  const held: { view?: View } = {}
  const { view, section, sent } = await openTables(
    { lake: lake() },
    {
      run: () => {
        if (held.view) held.view.lake = { ...lake(), lastRun: RUNNING_ROUND }
        return HttpResponse.json({ already: true }, { status: 200 })
      },
    },
  )
  held.view = view
  fireEvent.click(within(section).getByRole('button', { name: 'Ler de novo desde a data' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Ler de novo' }))
  expect(await within(section).findAllByText('Rodando…')).toHaveLength(2)
  expect(sent.filter((one) => one.path.endsWith('/lake-copy/run'))).toHaveLength(1)
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
})
