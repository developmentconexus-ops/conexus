import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import {
  ACTIVE_CLIENT,
  centralHub,
  DELETING_CLIENT,
  hubServer,
  refusal,
} from '../../platform/test-hub.tsx'

const server = hubServer()
const DETAIL = `/operations/clients/${DELETING_CLIENT.companyId}`

/** The Central with one client; the delete is answered by `answer`, and a 204 takes the client out. */
function hub(answer: () => Response, client = DELETING_CLIENT) {
  const clients = [client]
  const sent: unknown[] = []
  server.use(
    http.delete('*/api/clients/:companyId', async ({ request }) => {
      sent.push(await request.json())
      const response = answer()
      if (response.status === 204) clients.pop()
      return response
    }),
    http.get('*/api/clients/:companyId', () => {
      const [one] = clients
      return one ? HttpResponse.json({ client: one }) : refusal('NOT_FOUND')
    }),
    ...centralHub(clients),
  )
  return sent
}

function open() {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [DETAIL] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('apagando: "Exclusão em andamento." e Tentar concluir exclusão, sem corrigir, pessoas nem Apagar cliente', async () => {
  hub(() => refusal('CLIENT_DELETION_PENDING'))
  open()
  expect(await screen.findByText('Exclusão em andamento.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar concluir exclusão' })).toBeTruthy()
  for (const name of ['Corrigir dados', 'Apagar cliente', 'Reenviar']) {
    expect(screen.queryByRole('button', { name })).toBeNull()
  }
  expect(screen.queryByRole('heading', { name: 'Pessoas' })).toBeNull()
})

test('Tentar concluir exclusão manda o mesmo nome e revisão, sem pedir o nome, e termina em "Cliente apagado."', async () => {
  const sent = hub(() => new HttpResponse(null, { status: 204 }))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar concluir exclusão' }))
  expect(await screen.findByText('Cliente apagado.')).toBeTruthy()
  expect(sent).toEqual([{ name: DELETING_CLIENT.name, revision: DELETING_CLIENT.revision }])
})

test('na espera: "Concluindo…", desligado', async () => {
  const held = Promise.withResolvers<void>()
  hub(() => refusal('CLIENT_DELETION_PENDING'))
  server.use(
    http.delete('*/api/clients/:companyId', async () => {
      await held.promise
      return refusal('CLIENT_DELETION_PENDING')
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar concluir exclusão' }))
  expect(await screen.findByRole('button', { name: 'Concluindo…' })).toHaveProperty(
    'disabled',
    true,
  )
  held.resolve()
  await screen.findByRole('alert')
})

test('503: a frase da falha, e o botão volta', async () => {
  hub(() => refusal('CLIENT_DELETION_PENDING'))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar concluir exclusão' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A exclusão começou, mas o banco da empresa ainda não saiu. Tente concluir a exclusão.',
  )
  expect(screen.getByRole('button', { name: 'Tentar concluir exclusão' })).toHaveProperty(
    'disabled',
    false,
  )
})

test('404: vai à lista com "Este cliente não existe mais."', async () => {
  hub(() => refusal('NOT_FOUND'))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar concluir exclusão' }))
  expect(await screen.findByText('Este cliente não existe mais.')).toBeTruthy()
})

test('Apagar cliente com o banco fora: o diálogo fecha e a página lê de novo, agora com a exclusão em andamento', async () => {
  const clients = [ACTIVE_CLIENT]
  server.use(
    http.delete('*/api/clients/:companyId', () => {
      clients[0] = DELETING_CLIENT
      return refusal('CLIENT_DELETION_PENDING')
    }),
    http.get('*/api/clients/:companyId', () => HttpResponse.json({ client: clients[0] })),
    ...centralHub(clients),
  )
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/operations/clients/${ACTIVE_CLIENT.companyId}`] }),
  )
  render(<Conexus conexus={conexus} />)
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar cliente' }))
  await screen.findByRole('alertdialog')
  fireEvent.change(screen.getByLabelText('Digite o nome do cliente'), {
    target: { value: ACTIVE_CLIENT.name },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Apagar cliente' }))
  expect(await screen.findByText('Exclusão em andamento.')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
})
