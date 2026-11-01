import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const NOTE = {
  concept: 'Vendedor do pedido',
  mapping: 'TGFCAB.AD_CODVEND → TGFVEN.CODVEND',
  provedAt: '2026-10-30T14:02:00.000Z',
  provedRows: 20,
  writtenBy: 'Bruno',
}

function open(fields: { mayManage: boolean; notes: (typeof NOTE)[] }) {
  const connection = connectionOf({ name: 'Matriz', state: 'ACTIVE' })
  const view = viewOf({ connections: [connection], ...fields })
  server.use(...connectionsHub(view).handlers)
  mount(pageOf(connection))
  return { connection, view }
}

test('o Caderno mostra conceito, mapa, quando, quantas linhas e quem, e a dona apaga com confirmação', async () => {
  const { connection, view } = open({ mayManage: true, notes: [NOTE] })
  const notebook = within(await screen.findByRole('region', { name: 'Caderno' }))
  expect(notebook.getByText('Vendedor do pedido')).toBeTruthy()
  expect(notebook.getByText('TGFCAB.AD_CODVEND → TGFVEN.CODVEND')).toBeTruthy()
  expect(notebook.getByText(/provado em 30\/10 por Bruno, com 20 linhas/)).toBeTruthy()
  const gone: string[] = []
  server.use(
    http.delete(
      `*/api/companies/${COMPANY.id}/connections/${connection.id}/notes/:concept`,
      ({ params }) => {
        gone.push(String(params.concept))
        view.notes = []
        return new HttpResponse(null, { status: 204 })
      },
    ),
  )
  fireEvent.click(notebook.getByRole('button', { name: 'Apagar: Vendedor do pedido' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(within(dialog).getByText('Apagar a anotação "Vendedor do pedido"?')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar' }))
  await waitFor(() => expect(gone).toEqual(['Vendedor do pedido']))
  expect(await screen.findByText('O Builder ainda não anotou nada desta ligação.')).toBeTruthy()
})

test('o caderno vazio diz que o Builder ainda não anotou', async () => {
  open({ mayManage: true, notes: [] })
  expect(await screen.findByText('O Builder ainda não anotou nada desta ligação.')).toBeTruthy()
})

test('o membro lê o Caderno sem Apagar', async () => {
  open({ mayManage: false, notes: [NOTE] })
  const notebook = within(await screen.findByRole('region', { name: 'Caderno' }))
  expect(notebook.getByText('Vendedor do pedido')).toBeTruthy()
  expect(notebook.queryByRole('button')).toBeNull()
})
