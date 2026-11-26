import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { readyLake } from './lake-fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { fill, mark, next, openForm, openIntegrations, toChoose, viewOf } from './test-hub.tsx'

const server = hubServer()

function open(view: View = viewOf({ lake: readyLake() }), answers: Answers = {}) {
  return openIntegrations(server, view, answers)
}

function today() {
  return new Date().toLocaleDateString('sv-SE')
}

test('o que copiar pelo caminho do Acesso não pergunta a data, que o Acesso já perguntou', async () => {
  open()
  const dialog = await toChoose('2021-11-24')
  expect(within(dialog).getByText('Passo 3 de 4 · O que copiar')).toBeTruthy()
  expect(within(dialog).queryByLabelText('Desde')).toBeNull()
})

test('Voltar de Quando copiar leva a O que copiar com as marcas, e o de O que copiar ao Acesso', async () => {
  open()
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  next(dialog)
  await within(dialog).findByText('Passo 4 de 4 · Quando copiar')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar' }))
  expect(await within(dialog).findByText('Passo 3 de 4 · O que copiar')).toBeTruthy()
  expect(
    within(dialog).getByRole('checkbox', { name: 'Notas e pedidos' }).getAttribute('aria-checked'),
  ).toBe('true')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar' }))
  expect(await within(dialog).findByText('Passo 1 de 4 · Acesso')).toBeTruthy()
})

test('a exclusiva com tabelas vai do teste ao Ligado sem escolher nada', async () => {
  const lake = readyLake({ lake: { kind: 'UNAVAILABLE', reason: 'EXCLUSIVE_CREDENTIAL' } })
  const sent = open(viewOf({ lake }))
  const dialog = await openForm()
  fill('Comercial')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(await within(dialog).findByText('Ligado e funcionando.')).toBeTruthy()
  expect(within(dialog).queryByRole('checkbox')).toBeNull()
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
})

test('a ligação de um lago pronto sem tabela declarada vai do teste ao Ligado sem escolher nada', async () => {
  const sent = open(viewOf({ lake: readyLake({ tables: [] }) }))
  const dialog = await openForm()
  fill('Comercial')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Continuar' }))
  expect(await within(dialog).findByText('Ligado e funcionando.')).toBeTruthy()
  expect(within(dialog).queryByText('Passo 3 de 4 · O que copiar')).toBeNull()
  expect(sent.filter((one) => one.method === 'PUT')).toHaveLength(0)
})

test('a data de hoje vale: o Acesso aceita hoje e deixa Continuar', async () => {
  open()
  const dialog = await openForm()
  const since = within(dialog).getByLabelText<HTMLInputElement>('Desde')
  fireEvent.change(since, { target: { value: today() } })
  expect(within(dialog).getByRole('button', { name: 'Continuar' }).hasAttribute('disabled')).toBe(
    false,
  )
  expect(within(dialog).queryByText('A data não pode ser depois de hoje.')).toBeNull()
})

test('Ligado: o parágrafo diz quantas tabelas vão para o lago, como aparecem em Dados e que a primeira carga leva horas', async () => {
  open()
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  mark(dialog, 'Dados da NF-e')
  next(dialog)
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Ligar e copiar agora' }))
  expect(
    await within(dialog).findByText(
      '2 tabelas estão indo para o lago da empresa. Em Dados, cada uma aparece como Rodando… e vira Em dia quando termina. No Sankhya de uma empresa grande a primeira carga leva horas; você pode fechar esta janela.',
    ),
  ).toBeTruthy()
})

test('Ligado: com uma tabela o parágrafo vai para o singular', async () => {
  open()
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  next(dialog)
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Ligar e copiar agora' }))
  expect(
    await within(dialog).findByText(/^1 tabela está indo para o lago da empresa\./),
  ).toBeTruthy()
  expect(screen.queryByText(/estão indo/)).toBeNull()
})
