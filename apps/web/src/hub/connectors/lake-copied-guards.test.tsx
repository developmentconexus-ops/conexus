import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import { copiedLake, RUNNING_ROUND, readyLake } from './lake-fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const MATRIZ = connectionOf({ name: 'Matriz', state: 'ACTIVE' })
const COPIED = ['TGFCAB', 'TGFITE']
const TAKEN = 'Outra tabela da empresa já tem este nome.'

async function openTables(fields: Partial<View>, answers: Answers = {}) {
  const hub = connectionsHub(viewOf({ connections: [MATRIZ], ...fields }), answers)
  server.use(...hub.handlers)
  mount(pageOf(MATRIZ))
  fireEvent.click(await screen.findByRole('tab', { name: 'Tabelas' }))
  return within(await screen.findByRole('region', { name: 'Tabelas no lago' }))
}

async function markPartners(section: ReturnType<typeof within>) {
  fireEvent.click(section.getByRole('button', { name: /^Outras tabelas do Sankhya/ }))
  fireEvent.click(await section.findByRole('checkbox', { name: 'Parceiros' }))
}

test('com a rodada aberta Rodar agora e Ler de novo ficam desligados', async () => {
  const section = await openTables({
    lake: copiedLake(COPIED, { lastRun: RUNNING_ROUND, startDate: '2021-11-24' }),
  })
  expect(section.getByRole('button', { name: 'Rodar agora' }).hasAttribute('disabled')).toBe(true)
  expect(
    section.getByRole('button', { name: 'Ler de novo desde a data' }).hasAttribute('disabled'),
  ).toBe(true)
})

test('um nome digitado e recusado sai uma vez só, ao lado da tabela', async () => {
  const section = await openTables(
    { lake: copiedLake(COPIED) },
    { copy: () => refusal('COPY_NAME_TAKEN') },
  )
  await markPartners(section)
  fireEvent.change(section.getByLabelText('Nome no lago: Parceiros'), {
    target: { value: 'repetido' },
  })
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  await waitFor(() =>
    expect(section.getByLabelText('Nome no lago: Parceiros').getAttribute('aria-invalid')).toBe(
      'true',
    ),
  )
  expect(section.getAllByText(TAKEN)).toHaveLength(1)
  expect(section.getAllByRole('alert')).toHaveLength(1)
})

test('um nome sugerido e recusado, que a pessoa não digitou, sai uma vez só, no aviso da seção', async () => {
  const section = await openTables(
    { lake: copiedLake(COPIED) },
    { copy: () => refusal('COPY_NAME_TAKEN') },
  )
  await markPartners(section)
  fireEvent.click(section.getByRole('button', { name: 'Salvar' }))
  expect(await section.findAllByText(TAKEN)).toHaveLength(1)
  expect(section.getByRole('alert').textContent).toBe(TAKEN)
})

test('um lago pronto sem tabela declarada não diz que o dicionário caiu ao escolher o que copiar', async () => {
  const section = await openTables({ lake: readyLake({ tables: [] }) })
  fireEvent.click(section.getByRole('button', { name: 'Escolher o que copiar' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Sankhya' })
  expect(within(dialog).queryByText('Não deu para ler o dicionário agora.')).toBeNull()
})
