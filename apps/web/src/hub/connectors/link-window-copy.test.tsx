import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import { readyLake, TABLES } from './lake-fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import {
  choose,
  connectionsHub,
  fill,
  mark,
  mount,
  NEEDS_TABLE,
  next,
  openForm,
  openIntegrations,
  pageOf,
  toChoose,
  viewOf,
} from './test-hub.tsx'

const server = hubServer()

function open(view: View = viewOf({ lake: readyLake() }), answers: Answers = {}) {
  return openIntegrations(server, view, answers)
}

test('o que copiar: as tabelas por assunto, nada marcado, com rótulo, origem, descrição, colunas e modo; o nome só depois de marcar', async () => {
  open()
  const dialog = await toChoose()
  expect(within(dialog).getByText('Passo 3 de 4 · O que copiar')).toBeTruthy()
  for (const subject of ['Vendas', 'Financeiro']) {
    expect(within(dialog).getByRole('region', { name: subject })).toBeTruthy()
  }
  const vendas = within(within(dialog).getByRole('region', { name: 'Vendas' }))
  expect(vendas.getByText('Notas e pedidos')).toBeTruthy()
  expect(vendas.getByText('TGFCAB · 12 colunas')).toBeTruthy()
  expect(vendas.getByText('O que guarda Notas e pedidos.')).toBeTruthy()
  expect(vendas.getAllByText('Só o que mudou, por DTALTER')).toHaveLength(2)
  expect(vendas.getByText('Janela por mês, por DTNEG')).toBeTruthy()
  expect(within(dialog).getByText('Inteira')).toBeTruthy()
  const boxes = within(dialog).getAllByRole('checkbox')
  expect(boxes.filter((box) => box.getAttribute('aria-checked') === 'true')).toHaveLength(0)
  expect(within(dialog).queryByLabelText(/^Nome no lago/)).toBeNull()
  expect(within(dialog).getByLabelText<HTMLInputElement>('Prefixo').value).toBe('sankhya_')
  expect(within(dialog).getByRole('button', { name: 'Continuar' }).hasAttribute('disabled')).toBe(
    true,
  )
})

test('o que copiar: marcar mostra o nome sugerido, que se troca; o rodapé conta as marcadas e as limitadas pela data', async () => {
  open()
  const dialog = await toChoose('2021-11-24')
  mark(dialog, 'Notas e pedidos')
  mark(dialog, 'Itens das notas')
  const name = within(dialog).getByLabelText<HTMLInputElement>('Nome no lago: Notas e pedidos')
  expect(name.value).toBe('tgfcab')
  fireEvent.change(name, { target: { value: 'notas' } })
  expect(name.value).toBe('notas')
  expect(within(dialog).getByText('2 tabelas marcadas, 2 limitadas pela data')).toBeTruthy()
  mark(dialog, 'Parceiros')
  expect(within(dialog).getByText('3 tabelas marcadas, 2 limitadas pela data')).toBeTruthy()
  mark(dialog, 'Parceiros')
  mark(dialog, 'Itens das notas')
  expect(within(dialog).getByText('1 tabela marcada, 1 limitada pela data')).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Continuar' }).hasAttribute('disabled')).toBe(
    false,
  )
})

test('o que copiar: o assunto marca as suas tabelas de uma vez', async () => {
  open()
  const dialog = await toChoose()
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Marcar o grupo Vendas' }))
  expect(within(dialog).getByText('3 tabelas marcadas')).toBeTruthy()
  expect(within(dialog).getByText('3 de 3')).toBeTruthy()
})

test('o que copiar: o dicionário fora deixa a lista com o rótulo do kit e a frase', async () => {
  const lake = readyLake({
    tables: TABLES.map((one) => ({ ...one, columns: null, description: null })),
  })
  open(viewOf({ lake }))
  const dialog = await toChoose()
  expect(within(dialog).getByText('Não deu para ler o dicionário agora.')).toBeTruthy()
  expect(within(dialog).getByText('Notas e pedidos')).toBeTruthy()
  expect(within(dialog).getByText('TGFCAB')).toBeTruthy()
})

test('o que copiar: uma tabela sem o número de colunas entre outras com número não diz que o dicionário caiu', async () => {
  const lake = readyLake({
    tables: TABLES.map((one, index) => (index === 0 ? { ...one, columns: null } : one)),
  })
  open(viewOf({ lake }))
  const dialog = await toChoose()
  expect(within(dialog).getByText('Notas e pedidos')).toBeTruthy()
  expect(within(dialog).getByText('TGFITE · 12 colunas')).toBeTruthy()
  expect(within(dialog).queryByText('Não deu para ler o dicionário agora.')).toBeNull()
})

test('o que copiar: um nome recusado volta a este passo com a frase do código ao lado da tabela', async () => {
  open(viewOf({ lake: readyLake() }), { copy: () => refusal('COPY_NAME_TAKEN') })
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  fireEvent.change(within(dialog).getByLabelText('Nome no lago: Notas e pedidos'), {
    target: { value: 'repetido' },
  })
  next(dialog)
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Ligar e copiar agora' }))
  const field = await within(dialog).findByLabelText('Nome no lago: Notas e pedidos')
  expect(field.getAttribute('aria-invalid')).toBe('true')
  expect(
    within(dialog).getAllByText('Outra tabela da empresa já tem este nome.').length,
  ).toBeGreaterThan(0)
  expect(within(dialog).getByText('Passo 3 de 4 · O que copiar')).toBeTruthy()
})

test('o que copiar: pela seção de uma ligação sem cópia a janela abre aqui, com Desde no alto e sem o Acesso', async () => {
  const connection = connectionOf({ name: 'Matriz', state: 'ACTIVE' })
  const hub = connectionsHub(viewOf({ connections: [connection], lake: readyLake() }))
  server.use(...hub.handlers)
  mount(pageOf(connection))
  fireEvent.click(await screen.findByRole('tab', { name: 'Tabelas' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher o que copiar' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Sankhya' })
  expect(within(dialog).getByText('Passo 3 de 4 · O que copiar')).toBeTruthy()
  expect(within(dialog).queryByLabelText('Client ID')).toBeNull()
  expect(within(dialog).queryByRole('button', { name: 'Voltar' })).toBeNull()
  const since = within(dialog).getByLabelText<HTMLInputElement>('Desde')
  const prefix = within(dialog).getByLabelText('Prefixo')
  expect(since.compareDocumentPosition(prefix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(within(dialog).getByText(/^Todo o histórico\./)).toBeTruthy()
  mark(dialog, 'Notas e pedidos')
  fireEvent.change(since, { target: { value: '2999-01-01' } })
  expect(await within(dialog).findByText('A data não pode ser depois de hoje.')).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Continuar' }).hasAttribute('disabled')).toBe(
    true,
  )
  expect(hub.sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
})

test('quando copiar: vem em 24 h, com os seis intervalos e Só manual, e a revisão lista as tabelas, os nomes e a data', async () => {
  open()
  const dialog = await toChoose('2021-11-24')
  mark(dialog, 'Notas e pedidos')
  mark(dialog, 'Dados da NF-e')
  next(dialog)
  const interval = await within(dialog).findByRole('combobox', { name: 'Intervalo' })
  expect(interval.textContent).toContain('24 h')
  expect(within(dialog).getByText('Passo 4 de 4 · Quando copiar')).toBeTruthy()
  const review = within(within(dialog).getByRole('region', { name: 'Revisão' }))
  expect(review.getByText('sankhya_tgfcab')).toBeTruthy()
  expect(review.getByText('sankhya_tgfnfe')).toBeTruthy()
  expect(review.getByText('Desde 24/11/2021 nas tabelas que a data limita.')).toBeTruthy()
  expect(within(dialog).getByText('A cada 24 h, a partir de agora.')).toBeTruthy()
  fireEvent.click(interval)
  const options = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(options).toEqual(['15 min', '30 min', '1 h', '2 h', '6 h', '24 h', 'Só manual'])
})

test('quando copiar: sem data a revisão diz "Todo o histórico." e Só manual diz que só roda ao clicar', async () => {
  open()
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  next(dialog)
  await choose(await within(dialog).findByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  expect(within(dialog).getByText('Todo o histórico.')).toBeTruthy()
  expect(
    within(dialog).getByText('A ligação só copia quando você clicar em Rodar agora.'),
  ).toBeTruthy()
})

test('ligado: Ligar e copiar agora grava a cópia num pedido só, sem pedir rodada, e mostra a primeira carga e Ver em Dados', async () => {
  const sent = open()
  const dialog = await toChoose('2021-11-24')
  mark(dialog, 'Notas e pedidos')
  mark(dialog, 'Dados da NF-e')
  next(dialog)
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Ligar e copiar agora' }))
  expect(await within(dialog).findByText('A primeira carga começou.')).toBeTruthy()
  const writes = sent.filter((one) => one.path.includes('/lake-copy'))
  expect(
    writes.map(
      (one) => `${one.method} ${one.path.split('/connections/')[1]?.split('/').slice(1).join('/')}`,
    ),
  ).toEqual(['PUT lake-copy'])
  expect(writes[0]?.body).toEqual({
    tables: [
      { source: 'TGFCAB', name: 'sankhya_tgfcab' },
      { source: 'TGFNFE', name: 'sankhya_tgfnfe' },
    ],
    interval: '24h',
    startDate: '2021-11-24',
  })
  const see = within(dialog).getByRole('link', { name: 'Ver em Dados' })
  expect(see.getAttribute('href')).toBe(`/companies/${COMPANY.id}/data`)
  expect(
    within(screen.getByRole('list', { name: 'Passos' }))
      .getAllByRole('listitem')
      .some((one) => one.hasAttribute('aria-current')),
  ).toBe(false)
})

test('ligado: Só manual e sem data gravam MANUAL e null', async () => {
  const sent = open()
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  next(dialog)
  await choose(await within(dialog).findByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Ligar e copiar agora' }))
  await within(dialog).findByText('A primeira carga começou.')
  const put = sent.find((one) => one.method === 'PUT')
  expect(put?.body).toMatchObject({ interval: 'MANUAL', startDate: null })
})

test('ligado: o lago não pronto mostra a frase do código, a ligação fica feita e nenhuma cópia é gravada', async () => {
  const view = viewOf({ lake: readyLake() })
  open(view, { copy: () => refusal('COPY_LAKE_NOT_READY') })
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  next(dialog)
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Ligar e copiar agora' }))
  expect(
    await within(dialog).findByText(
      'O lago desta empresa não está pronto. Peça ao operador do Conexus.',
    ),
  ).toBeTruthy()
  expect(within(dialog).queryByText('A primeira carga começou.')).toBeNull()
  expect(view.connections).toHaveLength(1)
  expect(view.lake?.tables.some((one) => one.copy.kind === 'MARKED')).toBe(false)
})

test('a exclusiva: a ligação de credencial exclusiva ou sem tabela vai do teste ao Ligado, sem escolher nada', async () => {
  const lake = readyLake({
    lake: { kind: 'UNAVAILABLE', reason: 'EXCLUSIVE_CREDENTIAL' },
    tables: [],
  })
  const sent = open(viewOf({ lake }))
  const dialog = await openForm()
  fill('Comercial')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(await within(dialog).findByText('Ligado e funcionando.')).toBeTruthy()
  expect(within(dialog).queryByText(NEEDS_TABLE)).toBeNull()
  expect(within(dialog).queryByText('A primeira carga começou.')).toBeNull()
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
})

test('a exclusiva: quem liga e não gerencia cópias vai do teste ao Ligado com a frase de quem gerencia', async () => {
  open(viewOf({ role: 'member', mayManage: true, lake: readyLake() }))
  const dialog = await openForm()
  fill('Comercial')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(
    await within(dialog).findByText('Peça a quem gerencia as cópias para escolher o que copiar.'),
  ).toBeTruthy()
  expect(within(dialog).queryByText(NEEDS_TABLE)).toBeNull()
})

test('fechar no meio: fechar em O que copiar deixa a ligação feita, sem cópia, e na lista', async () => {
  const view = viewOf({ lake: readyLake() })
  const sent = open(view)
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
  expect(await screen.findByRole('link', { name: /Comercial/ })).toBeTruthy()
  expect(view.lake?.tables.some((one) => one.copy.kind === 'MARKED')).toBe(false)
})
