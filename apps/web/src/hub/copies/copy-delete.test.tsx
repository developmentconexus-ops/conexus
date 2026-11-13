import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { CLIENTES, copy, detailOf, LIST, onPhone, openCopies, VENDAS } from './test-hub.tsx'

// Apagar uma cópia (U2, criteria 10 and 11): the menu's item, the dialog's words and the way back.
const server = hubServer()

async function rowOf(name: string): Promise<HTMLElement> {
  const row = (await screen.findByText(name)).closest('tr, li')
  if (!(row instanceof HTMLElement)) throw new Error(`no row for ${name}`)
  return row
}

async function openDialog(label: string) {
  fireEvent.click(within(await rowOf(label)).getByRole('button', { name: `Ações: ${label}` }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  return screen.findByRole('alertdialog')
}

const CLIENTES_COPY = { id: CLIENTES, name: 'clientes', label: 'Clientes', projects: [] }

test('Apagar: a janela diz as linhas, cada Projeto e o copiar do zero; o sucesso tira a cópia da lista', async () => {
  const hub = openCopies(server, { copies: [copy(), copy(CLIENTES_COPY)] }, LIST)
  const dialog = await openDialog('Vendas')
  expect(within(dialog).getByText('Apagar a cópia Vendas?')).toBeTruthy()
  expect(
    within(dialog).getByText('As 118.402 linhas saem do banco da empresa e não voltam.'),
  ).toBeTruthy()
  expect(
    within(dialog).getByText(
      'O app do Projeto Vendedores deixa de ler esta cópia. Onde ele a usava, vai mostrar erro.',
    ),
  ).toBeTruthy()
  expect(
    within(dialog).getByText('Se você ligar esta cópia de novo, ela copia tudo do zero.'),
  ).toBeTruthy()
  expect(hub.writes()).toEqual([])

  fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar' }))
  await waitFor(() => expect(screen.queryByText('Vendas')).toBeNull())
  expect(screen.getByText('Clientes')).toBeTruthy()
  expect(hub.writes().map((one) => [one.method, one.path.split('/').at(-1)])).toEqual([
    ['DELETE', VENDAS],
  ])
})

test('Apagar: uma cópia sem Projeto e sem contagem mostra só as linhas e o aviso', async () => {
  openCopies(server, { copies: [copy({ ...CLIENTES_COPY, rows: null })] }, LIST)
  const dialog = await openDialog('Clientes')
  expect(
    within(dialog).getByText('As linhas desta cópia saem do banco da empresa e não voltam.'),
  ).toBeTruthy()
  expect(within(dialog).queryByText(/deixa de ler/)).toBeNull()
  expect(within(dialog).getByText(/copia tudo do zero/)).toBeTruthy()
})

test('Apagar: no detalhe, o sucesso volta para a lista', async () => {
  openCopies(server, { copies: [copy(), copy(CLIENTES_COPY)] }, detailOf(VENDAS))
  fireEvent.click(await screen.findByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Apagar' }),
  )
  expect(await screen.findByRole('heading', { name: 'Cópias' })).toBeTruthy()
  expect(await screen.findByText('Clientes')).toBeTruthy()
  expect(screen.queryByText('Vendas')).toBeNull()
})

test('Apagar: no celular a janela cabe e apaga do mesmo jeito', async () => {
  await onPhone(async () => {
    openCopies(server, { copies: [copy()] }, LIST)
    const dialog = await openDialog('Vendas')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar' }))
    await waitFor(() => expect(screen.queryByText('Vendas')).toBeNull())
  })
})

test('Apagar: falhas: o banco calado deixa a janela aberta com a frase do Hub; a tabela anotada se lê antes de fechar', async () => {
  let answer: () => Response | undefined = () => refusal('COPY_DATABASE_UNAVAILABLE')
  openCopies(server, { copies: [copy()], answers: { write: () => answer() } }, LIST)
  const dialog = await openDialog('Vendas')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar' }))
  expect(
    await within(dialog).findByText(
      'O banco da empresa não respondeu. Tente de novo em instantes.',
    ),
  ).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Apagar' })).toBeTruthy()
  expect(screen.getByText('Vendas')).toBeTruthy()

  answer = () => HttpResponse.json({ tablesLeft: ['vendas'] })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar' }))
  expect(await within(dialog).findByText(/A cópia foi apagada\. A tabela vendas/)).toBeTruthy()
  expect(within(dialog).queryByRole('button', { name: 'Apagar' })).toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})
