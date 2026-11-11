import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal, undecided } from '../../platform/test-hub.tsx'
import { connection, copy, LIST, openCopies } from './test-hub.tsx'

// Ligar uma cópia: the dialog, one request per attempt and the refusals (Capacidade 2, criterion 32).
const server = hubServer()

async function openDialog() {
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar uma cópia' }))
  return within(await screen.findByRole('dialog'))
}

async function choose(dialog: ReturnType<typeof within>, field: string, option: string) {
  fireEvent.click(await dialog.findByRole('combobox', { name: field }))
  const item = await screen.findByRole('option', { name: option })
  fireEvent.pointerDown(item)
  fireEvent.mouseDown(item)
  fireEvent.pointerUp(item)
  fireEvent.mouseUp(item)
  fireEvent.click(item)
}

async function fill(dialog: ReturnType<typeof within>) {
  await choose(dialog, 'Conexão', 'Matriz')
  await choose(dialog, 'Modelo', 'Vendas')
}

test('Ligar: um pedido, as recusas: dois cliques mandam um pedido só, com a chave de tentativa', async () => {
  const hub = openCopies(server, { copies: [] }, LIST)
  const dialog = await openDialog()
  await fill(dialog)
  const ligar = dialog.getByRole('button', { name: 'Ligar' })
  fireEvent.click(ligar)
  fireEvent.click(ligar)
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(hub.writes()).toHaveLength(1)
  expect(hub.writes()[0]?.body).toEqual({
    from: 'MODEL',
    connectionId: connection().id,
    model: 'vendas',
    interval: '30m',
  })
  expect(hub.writes()[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
  expect(await screen.findByText('Clientes')).toBeTruthy()
})

test('Ligar: um pedido, as recusas: o 503 mantém o diálogo aberto com a frase e a mesma chave', async () => {
  let refuse = true
  const hub = openCopies(
    server,
    {
      copies: [],
      answers: { write: () => (refuse ? refusal('COPY_DATABASE_UNAVAILABLE') : undefined) },
    },
    LIST,
  )
  const dialog = await openDialog()
  await fill(dialog)
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O banco da empresa não respondeu. Tente de novo em instantes.',
  )
  refuse = false
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(hub.writes()).toHaveLength(2)
  expect(hub.writes()[1]?.key).toBe(hub.writes()[0]?.key)
})

test('Ligar: um pedido, as recusas: COPY_EXISTS mostra a frase no formulário e uma resposta cortada mantém a chave', async () => {
  const refusals = [() => refusal('COPY_EXISTS'), undecided('{"copy":')[0]?.[1]]
  let next = 0
  const hub = openCopies(
    server,
    {
      copies: [copy()],
      answers: { write: () => refusals[next++]?.() },
    },
    LIST,
  )
  const dialog = await openDialog()
  await fill(dialog)
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A empresa já tem esta cópia. Abra a cópia na lista.',
  )
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toMatch(/^Não confirmamos a cópia/),
  )
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(3))
  expect(hub.writes()[2]?.key).toBe(hub.writes()[1]?.key)
  expect(hub.writes()[1]?.key).not.toBe(hub.writes()[0]?.key)
})

test('Ligar: sem conexão que tenha modelo, a frase e o link para Integrações', async () => {
  openCopies(server, { copies: [], connections: [connection({ connector: 'outro' })] }, LIST)
  const dialog = await openDialog()
  expect(
    await dialog.findByText('Ligue em Integrações uma conexão que ofereça cópias.'),
  ).toBeTruthy()
  expect(dialog.getByRole('link', { name: 'Ir para Integrações' })).toBeTruthy()
  expect(dialog.queryByRole('button', { name: 'Ligar' })).toBeNull()
})

test('Ligar: o formulário pede a conexão e o modelo antes de mandar', async () => {
  const hub = openCopies(server, { copies: [] }, LIST)
  const dialog = await openDialog()
  expect(await dialog.findByText('Escolha a conexão')).toBeTruthy()
  expect(dialog.getByText('Escolha o modelo')).toBeTruthy()
  fireEvent.click(await dialog.findByRole('button', { name: 'Ligar' }))
  expect(await dialog.findByText('Escolha a conexão.')).toBeTruthy()
  expect(hub.writes()).toHaveLength(0)
})
