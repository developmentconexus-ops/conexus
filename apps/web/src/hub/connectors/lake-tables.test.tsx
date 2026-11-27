import type { LakeTablesOfConnection } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { copiedLake, RUNNING_ROUND, readyLake } from './lake-fixtures.ts'
import type { View } from './test-hub.tsx'
import { choose } from './test-hub.tsx'
import { openTables } from './test-lake.tsx'

const server = hubServer()

const COPIED = ['TGFCAB', 'TGFITE']
function lake(fields: Partial<LakeTablesOfConnection> = {}) {
  return copiedLake(COPIED, { startDate: '2021-11-24', ...fields })
}

test('a seção: as tabelas copiadas com o nome fixo, o intervalo, a última rodada e Rodar agora', async () => {
  const { section } = await openTables(server, { lake: lake() })
  const view = within(section)
  expect(view.getByText('Notas e pedidos')).toBeTruthy()
  expect(view.getByText('sankhya_tgfcab')).toBeTruthy()
  expect(view.getAllByText('Em dia')).toHaveLength(2)
  expect(view.getByRole('combobox', { name: 'Intervalo' }).textContent).toContain('24 h')
  expect(view.getByText(/^Última rodada /)).toBeTruthy()
  expect(view.getByRole('button', { name: 'Rodar agora' })).toBeTruthy()
  expect(view.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(true)
  expect(view.queryByText('Parceiros')).toBeNull()
})

test('a seção: as tabelas copiadas ficam sob o assunto, com o número de colunas e a nota de que o nome não muda mais', async () => {
  const marked = copiedLake(['TGFCAB', 'TGFITE', 'TGFNFE'])
  const { section } = await openTables(server, { lake: marked })
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
  const { section } = await openTables(server, { lake: copiedLake(['TGFCAB'], { tables: dark }) })
  const view = within(section)
  expect(view.getByText('TGFCAB')).toBeTruthy()
  expect(view.queryByText(/colunas/)).toBeNull()
})

test('a seção: marcar outra mostra o nome sugerido, que se troca; Salvar grava num pedido só com os nomes que não mudam', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
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
    fullPass: 'OFF',
  })
})

test('a seção: desmarcar e mudar o intervalo, Só manual incluído, gravam por Salvar', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  await choose(within(section).getByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Tirar do lago' }),
  )
  await waitFor(() => expect(sent.some((one) => one.method === 'PUT')).toBe(true))
  expect(sent.find((one) => one.method === 'PUT')?.body).toEqual({
    tables: [{ source: 'TGFCAB', name: 'sankhya_tgfcab' }],
    interval: 'MANUAL',
    startDate: '2021-11-24',
    fullPass: 'OFF',
  })
  await waitFor(() => expect(within(section).queryByText('Itens das notas')).toBeNull())
})

test('a seção: Rodar agora pede a rodada sem relê-la inteira', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  fireEvent.click(within(section).getByRole('button', { name: 'Rodar agora' }))
  await waitFor(() => expect(sent.some((one) => one.path.endsWith('/lake-copy/run'))).toBe(true))
  expect(sent.find((one) => one.path.endsWith('/lake-copy/run'))?.body).toEqual({ whole: false })
  expect(await within(section).findAllByText('Rodando…')).toHaveLength(2)
})

test('a seção: sem cópia diz que nada é copiado e oferece Escolher o que copiar', async () => {
  const { section } = await openTables(server, { lake: readyLake() })
  expect(within(section).getByText('Nada desta ligação é copiado para o lago.')).toBeTruthy()
  expect(within(section).getByRole('button', { name: 'Escolher o que copiar' })).toBeTruthy()
})

test('a seção: sem lago pronto diz a frase da matriz e não oferece escolher', async () => {
  const { section } = await openTables(server, { lake: readyLake({ lake: { kind: 'NOT_READY' } }) })
  expect(
    within(section).getByText('O lago desta empresa não está pronto. Peça ao operador do Conexus.'),
  ).toBeTruthy()
  expect(within(section).queryByRole('button', { name: 'Escolher o que copiar' })).toBeNull()
})

test('a seção: quem não gerencia cópias vê as caixas, Salvar, Rodar agora e Ler de novo à vista e desligados, com a frase de quem muda; clicar neles não chama rota', async () => {
  const { section, sent } = await openTables(server, {
    role: 'member',
    mayManage: false,
    lake: lake(),
  })
  const view = within(section)
  expect(view.getByText('Notas e pedidos')).toBeTruthy()
  expect(view.getByText('sankhya_tgfcab')).toBeTruthy()
  expect(view.getAllByText('Só quem gerencia as cópias muda o que se copia.')).toHaveLength(1)
  const boxes = view.getAllByRole('checkbox')
  expect(boxes).toHaveLength(2)
  for (const box of boxes) expect(box.getAttribute('aria-disabled')).toBe('true')
  for (const name of ['Salvar', 'Rodar agora', 'Ler de novo desde a data']) {
    expect(view.getByRole('button', { name }).hasAttribute('disabled')).toBe(true)
  }
  expect(view.queryByRole('button', { name: /^Outras tabelas/ })).toBeNull()
  fireEvent.click(view.getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(view.getByRole('button', { name: 'Salvar' }))
  fireEvent.click(view.getByRole('button', { name: 'Rodar agora' }))
  expect(view.getByRole('checkbox', { name: 'Itens das notas' }).getAttribute('aria-checked')).toBe(
    'true',
  )
  expect(screen.queryByRole('alertdialog')).toBeNull()
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
})

test('a seção: quem gerencia cópias não vê a frase de quem muda e tem tudo ligado', async () => {
  const { section } = await openTables(server, { lake: lake() })
  const view = within(section)
  expect(view.queryByText('Só quem gerencia as cópias muda o que se copia.')).toBeNull()
  expect(view.getByRole('button', { name: 'Rodar agora' }).hasAttribute('disabled')).toBe(false)
  for (const box of view.getAllByRole('checkbox')) {
    expect(box.getAttribute('aria-disabled')).not.toBe('true')
  }
})

test('a seção: a rodada aberta no Hub aparece como Rodando…, e a recusa por rodada aberta diz a frase do código', async () => {
  const running = copiedLake(COPIED, { lastRun: RUNNING_ROUND })
  const { section } = await openTables(
    server,
    { lake: running },
    { copy: () => refusal('COPY_RUN_OPEN') },
  )
  expect(within(section).getAllByText('Rodando…')).toHaveLength(2)
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Tirar do lago' }),
  )
  expect(
    await within(section).findByText(
      'A ligação está copiando agora. Desmarque quando a rodada terminar.',
    ),
  ).toBeTruthy()
})

test('ler de novo desde a data: o diálogo lista as tabelas que a data limita, cada uma com o que o lago troca, e Ler de novo pede whole: true', async () => {
  const { section, sent } = await openTables(server, {
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
  const { section, sent } = await openTables(server, { lake: copiedLake(COPIED) })
  fireEvent.click(within(section).getByRole('button', { name: 'Ler de novo desde a data' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Ler de novo desde o começo?' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
})

test('ler de novo desde a data: sem tabela que a data limite o botão não aparece', async () => {
  const { section } = await openTables(server, {
    lake: copiedLake(['TGFPAR', 'TGFNFE'], { startDate: '2021-11-24' }),
  })
  expect(within(section).getByText('Parceiros')).toBeTruthy()
  expect(within(section).queryByRole('button', { name: 'Ler de novo desde a data' })).toBeNull()
})

test('ler de novo desde a data: com a resposta already nada muda e as tabelas seguem Rodando…', async () => {
  const held: { view?: View } = {}
  const { view, section, sent } = await openTables(
    server,
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

function PUTS<Call extends { method: string }>(sent: Call[]) {
  return sent.filter((one) => one.method === 'PUT')
}

test('desmarcar pede confirmação: Salvar lista as tabelas que saem, com o nome no lago, e Tirar do lago grava uma vez com as que ficam', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Tirar 1 tabela do lago?' })
  expect(within(dialog).getByText('O lago apaga estas tabelas e as linhas delas:')).toBeTruthy()
  expect(
    within(dialog)
      .getAllByRole('listitem')
      .map((one) => one.textContent),
  ).toEqual(['Itens das notassankhya_tgfite'])
  expect(within(dialog).getByText('As outras tabelas seguem como sempre.')).toBeTruthy()
  expect(PUTS(sent)).toHaveLength(0)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tirar do lago' }))
  await waitFor(() => expect(PUTS(sent)).toHaveLength(1))
  expect(PUTS(sent)[0]?.body).toMatchObject({ tables: [{ source: 'TGFCAB' }] })
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})

test('desmarcar pede confirmação: com a gravação em andamento o diálogo segue aberto e Tirar do lago desligado, e fecha quando ela termina', async () => {
  const { section } = await openTables(server, { lake: lake() })
  let writes = 0
  let finish: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    finish = resolve
  })
  server.use(
    http.put('*/api/companies/*/connections/*/lake-copy', async () => {
      writes += 1
      await held
      return refusal('COPY_RUN_OPEN')
    }),
  )
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tirar do lago' }))
  await waitFor(() =>
    expect(
      within(dialog).getByRole('button', { name: 'Tirar do lago' }).hasAttribute('disabled'),
    ).toBe(true),
  )
  expect(screen.getByRole('alertdialog')).toBeTruthy()
  expect(writes).toBe(1)
  finish()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})

test('desmarcar pede confirmação: com duas saindo o título diz o plural, e Cancelar não chama nada e mantém as marcas', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Notas e pedidos' }))
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Tirar 2 tabelas do lago?' })
  expect(within(dialog).getAllByRole('listitem')).toHaveLength(2)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
  for (const name of ['Itens das notas', 'Notas e pedidos']) {
    expect(within(section).getByRole('checkbox', { name }).getAttribute('aria-checked')).toBe(
      'false',
    )
  }
})

test('desmarcar pede confirmação: Salvar que não desmarca nenhuma grava sem diálogo', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  await choose(within(section).getByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(PUTS(sent)).toHaveLength(1))
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('desmarcar pede confirmação: marcar outra e desmarcar uma juntas também abre, e só a que sai está na lista', async () => {
  const { section, sent } = await openTables(server, { lake: lake() })
  fireEvent.click(within(section).getByRole('button', { name: /^Outras tabelas do Sankhya \(2\)/ }))
  fireEvent.click(await within(section).findByRole('checkbox', { name: 'Parceiros' }))
  fireEvent.click(within(section).getByRole('checkbox', { name: 'Itens das notas' }))
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  const dialog = await screen.findByRole('alertdialog', { name: 'Tirar 1 tabela do lago?' })
  expect(within(dialog).queryByText('Parceiros')).toBeNull()
  expect(within(dialog).getByText('Itens das notas')).toBeTruthy()
  expect(PUTS(sent)).toHaveLength(0)
})
