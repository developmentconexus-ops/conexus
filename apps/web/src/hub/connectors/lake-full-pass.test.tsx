import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { dayAndHour } from '../../platform/dates.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { copiedLake, NEXT_FULL_PASS, readyLake } from './lake-fixtures.ts'
import { choose, mark, next, openIntegrations, toChoose, viewOf } from './test-hub.tsx'
import { openTables } from './test-lake.tsx'

const server = hubServer()

const COPIED = ['TGFCAB', 'TGFITE']
const HELP = 'Relê todas as tabelas e tira do lago o que sumiu do Sankhya.'
const MANUAL = 'Com Só manual, nada roda sozinho.'
const OFF = 'Passada inteira desligada.'
const NEXT = `Próxima passada inteira: ${dayAndHour(NEXT_FULL_PASS)}.`
const WEEKLY = 'Toda semana, domingo de madrugada'

function field(within_: HTMLElement) {
  return within(within_).getByRole('combobox', { name: 'Passada inteira' })
}

async function toWhen() {
  const sent = openIntegrations(server, viewOf({ lake: readyLake() }), {})
  const dialog = await toChoose()
  mark(dialog, 'Notas e pedidos')
  next(dialog)
  await within(dialog).findByRole('combobox', { name: 'Passada inteira' })
  return { sent, dialog }
}

test('Quando copiar: Desligada já escolhida, com a frase e as três escolhas', async () => {
  const { dialog } = await toWhen()
  expect(field(dialog).textContent).toContain('Desligada')
  expect(within(dialog).getByText(HELP)).toBeTruthy()
  fireEvent.click(field(dialog))
  const options = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(options).toEqual([WEEKLY, 'Toda madrugada', 'Desligada'])
})

test('Quando copiar: a escolha vai no pedido que liga a cópia', async () => {
  const { dialog, sent } = await toWhen()
  await choose(field(dialog), 'Toda madrugada')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Ligar e copiar agora' }))
  await within(dialog).findByText('A primeira carga começou.')
  expect(sent.find((one) => one.method === 'PUT')?.body).toMatchObject({ fullPass: 'DAILY' })
})

test('Quando copiar: com Só manual o campo fica desligado e diz que nada roda sozinho', async () => {
  const { dialog } = await toWhen()
  await choose(within(dialog).getByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  expect(field(dialog).hasAttribute('disabled')).toBe(true)
  expect(within(dialog).getByText(MANUAL)).toBeTruthy()
  expect(within(dialog).queryByText(HELP)).toBeNull()
})

test('Tabelas no lago: a cópia que já existe mostra Desligada', async () => {
  const { section } = await openTables(server, { lake: copiedLake(COPIED) })
  expect(field(section).textContent).toContain('Desligada')
  expect(within(section).getByText(OFF)).toBeTruthy()
  expect(within(section).getByRole('button', { name: 'Salvar' }).hasAttribute('disabled')).toBe(
    true,
  )
})

test('Tabelas no lago: o valor gravado e a próxima passada; mudar e salvar grava a escolha', async () => {
  const on = copiedLake(COPIED, { fullPass: 'WEEKLY', fullNext: NEXT_FULL_PASS })
  const { section, sent } = await openTables(server, { lake: on })
  expect(field(section).textContent).toContain(WEEKLY)
  expect(within(section).getByText(NEXT)).toBeTruthy()
  await choose(field(section), 'Desligada')
  fireEvent.click(within(section).getByRole('button', { name: 'Salvar' }))
  expect(await within(section).findByText(OFF)).toBeTruthy()
  await waitFor(() => expect(within(section).queryByText(NEXT)).toBeNull())
  expect(sent.find((one) => one.method === 'PUT')?.body).toMatchObject({ fullPass: 'OFF' })
})

test('Tabelas no lago: com Só manual o campo fica desligado e diz que nada roda sozinho', async () => {
  const { section } = await openTables(server, { lake: copiedLake(COPIED) })
  await choose(within(section).getByRole('combobox', { name: 'Intervalo' }), 'Só manual')
  expect(field(section).hasAttribute('disabled')).toBe(true)
  expect(within(section).getByText(MANUAL)).toBeTruthy()
  expect(within(section).queryByText(OFF)).toBeNull()
})

test.each([
  { copy: { fullPass: 'WEEKLY', fullNext: NEXT_FULL_PASS }, says: NEXT },
  { copy: { fullPass: 'OFF' }, says: OFF },
  { copy: { interval: 'MANUAL', fullPass: 'DAILY' }, says: MANUAL },
] as const)('quem não gerencia cópias vê o texto sem o campo: $says', async ({ copy, says }) => {
  const lake = copiedLake(COPIED, copy)
  const { section } = await openTables(server, { role: 'member', mayManage: false, lake })
  expect(within(section).getByText(says)).toBeTruthy()
  expect(within(section).queryByRole('combobox', { name: 'Passada inteira' })).toBeNull()
})

test('uma ligação sem cópia não tem o campo', async () => {
  const { section } = await openTables(server, { lake: readyLake() })
  expect(within(section).queryByRole('combobox', { name: 'Passada inteira' })).toBeNull()
  expect(within(section).queryByText(OFF)).toBeNull()
})
