import { Client } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { awaitingClient, centralHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()
const CLIENT = awaitingClient()
const UNCONFIRMED = 'Não confirmamos a exclusão. Veja a lista antes de tentar de novo.'

/** The Central with one client, the delete answered by `answer`; `clients` empties on a 204. */
function hub(answer: () => Response) {
  const clients = [CLIENT]
  const sent: unknown[] = []
  const reads = { client: 0 }
  server.use(
    http.delete('*/api/clients/:companyId', async ({ request }) => {
      sent.push(await request.json())
      const response = answer()
      if (response.status === 204) clients.pop()
      return response
    }),
    http.get('*/api/clients/:companyId', () => {
      reads.client += 1
      const [client] = clients
      return client ? HttpResponse.json({ client }) : refusal('NOT_FOUND')
    }),
    ...centralHub(clients),
  )
  return { sent, reads }
}

async function open() {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/operations/clients/${CLIENT.companyId}`] }),
  )
  render(<Conexus conexus={conexus} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar cliente' }))
  return screen.findByRole('alertdialog')
}

function confirm(name = CLIENT.name) {
  fireEvent.change(screen.getByLabelText('Digite o nome do cliente'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Apagar cliente' }))
}

test('vazio: o título, o que sai, o campo com o foco, Cancelar e Apagar cliente desabilitado', async () => {
  hub(() => new HttpResponse(null, { status: 204 }))
  const dialog = await open()
  expect(screen.getByRole('heading', { name: 'Apagar Empresa Teste?' })).toBeTruthy()
  expect(dialog.textContent).toContain(
    'Saem a empresa, os membros, os convites e o cadastro. As pessoas continuam com as contas delas.',
  )
  const field = screen.getByLabelText('Digite o nome do cliente')
  await waitFor(() => expect(document.activeElement).toBe(field))
  expect(screen.getByRole('button', { name: 'Apagar cliente' })).toHaveProperty('disabled', true)
  // Modal: the page behind is hidden from assistive technology while the dialog is open.
  expect(screen.queryByRole('button', { name: 'Corrigir dados' })).toBeNull()
  expect(screen.getAllByRole('button', { name: 'Apagar cliente' })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(screen.getByRole('button', { name: 'Corrigir dados' })).toBeTruthy()
})

test('Enter sem o nome não confirma; um nome diferente também não', async () => {
  const { sent } = hub(() => new HttpResponse(null, { status: 204 }))
  await open()
  const field = screen.getByLabelText('Digite o nome do cliente')
  fireEvent.change(field, { target: { value: 'empresa teste' } })
  fireEvent.submit(field.closest('form') ?? field)
  await screen.findByText('O nome não confere.')
  expect(screen.getByRole('button', { name: 'Apagar cliente' })).toHaveProperty('disabled', true)
  expect(sent).toEqual([])
})

test('204: envia o nome e a revisão lida, vai à lista com "Cliente apagado." e o cliente some', async () => {
  const { sent } = hub(() => new HttpResponse(null, { status: 204 }))
  await open()
  confirm()
  expect(await screen.findByText('Cliente apagado.')).toBeTruthy()
  expect(screen.getByText('Nenhum cliente cadastrado.')).toBeTruthy()
  expect(sent).toEqual([{ name: 'Empresa Teste', revision: 0 }])
})

test('enquanto apaga, "Apagando…" e os botões bloqueados', async () => {
  const answer = Promise.withResolvers<void>()
  hub(() => new HttpResponse(null, { status: 204 }))
  server.use(
    http.delete('*/api/clients/:companyId', async () => {
      await answer.promise
      return refusal('CLIENT_STALE')
    }),
  )
  await open()
  confirm()
  expect(await screen.findByRole('button', { name: 'Apagando…' })).toHaveProperty('disabled', true)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveProperty('disabled', true)
  answer.resolve()
  await screen.findByRole('alert')
})

for (const [name, answer] of [
  ['corte', () => HttpResponse.error()],
  ['502 da borda', () => new HttpResponse('<html></html>', { status: 502 })],
  ['503 do banco', () => refusal('DATABASE_UNAVAILABLE')],
] as const) {
  test(`${name}: o diálogo fica e diz que não confirmou`, async () => {
    hub(answer)
    await open()
    confirm()
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(screen.getByLabelText('Digite o nome do cliente')).toHaveProperty('value', CLIENT.name)
  })
}

test('404: fecha e vai à lista com "Este cliente não existe mais."', async () => {
  hub(() => refusal('NOT_FOUND'))
  await open()
  confirm()
  expect(await screen.findByText('Este cliente não existe mais.')).toBeTruthy()
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('412: "Este cliente mudou." e o cliente é lido de novo, com a revisão nova', async () => {
  const { reads, sent } = hub(() => refusal('CLIENT_STALE'))
  await open()
  const before = reads.client
  server.use(
    http.get('*/api/clients/:companyId', () => {
      reads.client += 1
      return HttpResponse.json({ client: Client.parse({ ...CLIENT, revision: 1 }) })
    }),
  )
  confirm()
  expect((await screen.findByRole('alert')).textContent).toBe('Este cliente mudou.')
  await waitFor(() => expect(reads.client).toBeGreaterThan(before))
  confirm()
  await waitFor(() => expect(sent).toHaveLength(2))
  expect(sent[1]).toEqual({ name: 'Empresa Teste', revision: 1 })
})

test('422: "O nome não confere." no campo', async () => {
  hub(() => refusal('CLIENT_NAME_MISMATCH'))
  await open()
  confirm()
  expect(await screen.findByText('O nome não confere.')).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByLabelText('Digite o nome do cliente').getAttribute('aria-invalid')).toBe(
      'true',
    ),
  )
})
