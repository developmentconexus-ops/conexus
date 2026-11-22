import type { Client, ClientLake } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import {
  ACTIVE_CLIENT,
  centralHub,
  DELETING_CLIENT,
  hubServer,
  refusal,
} from '../../platform/test-hub.tsx'

const server = hubServer()
const AT = '2026-11-22T10:42:00.000-03:00'
const READY = {
  state: 'READY',
  bucket: 'conexus-k3x9a0b1c2d3',
  region: 'us-east-2',
  readyAt: AT,
} as const

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

/** The 5 s between two reads of a moving lake. */
async function tick() {
  await vi.advanceTimersByTimeAsync(5_100)
}

type Answer = () => Response

/** The Central with one client whose lake is `held.lake`; creating and deleting answer as told. */
function world(
  lake: ClientLake,
  answers: { create?: Answer; remove?: Answer; read?: Answer } = {},
  client: Client = ACTIVE_CLIENT,
) {
  const deleted: unknown[] = []
  const held = { lake, created: 0, deleted }
  server.use(
    http.get('*/api/clients/:companyId/lake', () =>
      answers.read ? answers.read() : HttpResponse.json({ lake: held.lake }),
    ),
    http.post('*/api/clients/:companyId/lake', () => {
      held.created += 1
      return answers.create
        ? answers.create()
        : HttpResponse.json({ lake: held.lake }, { status: 202 })
    }),
    http.delete('*/api/clients/:companyId/lake', async ({ request }) => {
      held.deleted.push(await request.json())
      return answers.remove
        ? answers.remove()
        : HttpResponse.json({ lake: held.lake }, { status: 202 })
    }),
    ...centralHub([client]),
  )
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/operations/clients/${client.companyId}`] }),
  )
  render(<Conexus conexus={conexus} />)
  return held
}

async function block() {
  return within(await screen.findByRole('region', { name: 'Lago de dados' }))
}

test('lago: do sem lago ao pronto, perguntando de novo a cada 5 s', async () => {
  const held = world({ state: 'NONE' })
  const lake = await block()
  expect(await lake.findByText('Esta empresa ainda não tem lago.')).toBeTruthy()
  held.lake = { state: 'CREATING', since: AT }
  fireEvent.click(lake.getByRole('button', { name: 'Criar o lago' }))
  expect((await lake.findByRole('status')).textContent).toMatch(
    /^Criando o lago…Começou às \d\d:\d\d\.$/,
  )
  held.lake = READY
  await tick()
  await waitFor(() =>
    expect(lake.getByText(/está em us-east-2 desde \d\d\/\d\d\/2026 \d\d:\d\d\./)).toBeTruthy(),
  )
  expect(lake.getByText('conexus-k3x9a0b1c2d3')).toBeTruthy()
  expect(lake.getByRole('button', { name: 'Apagar o lago' })).toBeTruthy()
  expect(held.created).toBe(1)
})

test('lago: a falha oferece tentar de novo, que cria outro', async () => {
  const held = world({ state: 'FAILED', code: 'LAKE_CREATE_FAILED', at: AT })
  const lake = await block()
  expect(
    await lake.findByText('Não deu para criar o lago. A AWS desfez o que tinha começado.'),
  ).toBeTruthy()
  held.lake = { state: 'CREATING', since: AT }
  fireEvent.click(lake.getByRole('button', { name: 'Tentar de novo' }))
  expect(await lake.findByText('Criando o lago…')).toBeTruthy()
  expect(held.created).toBe(1)
})

test('lago: apagar pede o nome exato; o nome recusado fica no campo; confirmado, apagando e depois o sem lago', async () => {
  let refuse = true
  const held = world(READY, {
    remove: () =>
      refuse
        ? refusal('CLIENT_NAME_MISMATCH')
        : HttpResponse.json({ lake: { state: 'DELETING', since: AT } }, { status: 202 }),
  })
  fireEvent.click(await (await block()).findByRole('button', { name: 'Apagar o lago' }))
  const dialog = within(
    await screen.findByRole('alertdialog', { name: `Apagar o lago de ${ACTIVE_CLIENT.name}?` }),
  )
  const confirm = dialog.getByRole('button', { name: 'Apagar o lago' })
  const field = dialog.getByLabelText(`Digite ${ACTIVE_CLIENT.name} para confirmar`)
  expect(confirm).toHaveProperty('disabled', true)
  fireEvent.change(field, { target: { value: `${ACTIVE_CLIENT.name} ` } })
  expect(confirm).toHaveProperty('disabled', true)
  fireEvent.change(field, { target: { value: ACTIVE_CLIENT.name } })
  expect(confirm).toHaveProperty('disabled', false)
  fireEvent.click(confirm)
  expect(await dialog.findByText(FAILURES.CLIENT_NAME_MISMATCH.phrase)).toBeTruthy()
  refuse = false
  held.lake = { state: 'DELETING', since: AT }
  fireEvent.click(confirm)
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const lake = await block()
  expect((await lake.findByRole('status')).textContent).toBe('Apagando o lago…')
  expect(held.deleted).toEqual([{ name: ACTIVE_CLIENT.name }, { name: ACTIVE_CLIENT.name }])
  held.lake = { state: 'NONE' }
  await tick()
  await waitFor(() => expect(lake.getByText('Esta empresa ainda não tem lago.')).toBeTruthy())
})

test('lago: o apagar que falhou oferece tentar de novo; o lago ocupado mostra a frase do Hub', async () => {
  const held = world({ state: 'DELETE_FAILED', at: AT }, { remove: () => refusal('LAKE_BUSY') })
  const lake = await block()
  expect(await lake.findByText('Não deu para apagar o lago.')).toBeTruthy()
  fireEvent.click(lake.getByRole('button', { name: 'Tentar apagar de novo' }))
  expect((await lake.findByRole('alert')).textContent).toBe(FAILURES.LAKE_BUSY.phrase)
  expect(held.deleted).toEqual([{ name: ACTIVE_CLIENT.name }])
  expect(lake.getByText('Não deu para apagar o lago.')).toBeTruthy()
})

test('lago: o erro de leitura fica no bloco, e o resto da página fica', async () => {
  let down = true
  world(
    { state: 'NONE' },
    {
      read: () =>
        down ? refusal('DATABASE_UNAVAILABLE') : HttpResponse.json({ lake: { state: 'NONE' } }),
    },
  )
  const lake = await block()
  expect(await lake.findByText('Não deu para ler o lago agora.')).toBeTruthy()
  expect(screen.getByRole('heading', { name: ACTIVE_CLIENT.name })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Apagar cliente' })).toBeTruthy()
  down = false
  fireEvent.click(lake.getByRole('button', { name: 'Tentar de novo' }))
  expect(await lake.findByText('Esta empresa ainda não tem lago.')).toBeTruthy()
})

test('lago: o pedido de criar recusado mostra a frase do Hub, e o estado de antes fica', async () => {
  let code: 'LAKE_BUSY' | 'DATABASE_UNAVAILABLE' = 'LAKE_BUSY'
  world({ state: 'NONE' }, { create: () => refusal(code) })
  const lake = await block()
  fireEvent.click(await lake.findByRole('button', { name: 'Criar o lago' }))
  expect((await lake.findByRole('alert')).textContent).toBe(FAILURES.LAKE_BUSY.phrase)
  expect(lake.getByText('Esta empresa ainda não tem lago.')).toBeTruthy()
  code = 'DATABASE_UNAVAILABLE'
  fireEvent.click(lake.getByRole('button', { name: 'Criar o lago' }))
  await waitFor(() =>
    expect(lake.getByRole('alert').textContent).toContain(FAILURES.DATABASE_UNAVAILABLE.phrase),
  )
  expect(lake.getByText('Esta empresa ainda não tem lago.')).toBeTruthy()
})

test('lago: o cliente em exclusão não mostra o lago', async () => {
  world({ state: 'NONE' }, {}, DELETING_CLIENT)
  expect(await screen.findByText('Exclusão em andamento.')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Lago de dados' })).toBeNull()
})

test('lago: o texto de Apagar cliente nomeia o lago', async () => {
  world({ state: 'NONE' })
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar cliente' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(dialog.textContent).toContain(
    'Os Projetos, o banco e o lago da empresa também serão apagados.',
  )
})
