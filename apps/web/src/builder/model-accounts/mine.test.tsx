import { PersonId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { ACTIVE_CLIENT, centralHub, hubServer } from '../../platform/test-hub.tsx'
import type { View } from './test-hub.tsx'
import { accountOf, modelHub } from './test-hub.tsx'

const server = hubServer()
const SETUP = `/companies/${COMPANY.id}/setup`

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    defaultModel: null,
    mayManage: false,
    ...fields,
  }
}

function open(shown: View, path = SETUP) {
  const hub = modelHub(shown)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, router: conexus.router }
}

async function openMine(shown: View) {
  const hub = open(shown)
  const [link] = await screen.findAllByRole('link', { name: 'Minha conta de modelo' })
  if (link) fireEvent.click(link)
  await screen.findByRole('heading', { name: 'Minha conta de modelo' })
  return hub
}

test('o trilho leva a Minha conta de modelo; sem contas: "Nenhuma conta sua"', async () => {
  const { router } = await openMine(view())
  expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}/model-account`)
  expect(screen.getByText('Nenhuma conta sua')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ligar conta' })).toBeTruthy()
  expect(screen.queryByText(/Sua ordem para/)).toBeNull()
})

test('a ordem da pessoa por fornecedor, e as contas dela, que ela ordena, sem Dar a pessoas', async () => {
  const time2 = accountOf({
    label: 'Time 2',
    position: 0,
    assignees: [PersonId.parse('person-ana')],
  })
  const time1 = accountOf({ label: 'Time 1', position: 1 })
  const first = accountOf({ label: 'Minha 1', owner: 'me', position: 0 })
  const second = accountOf({ label: 'Minha 2', owner: 'me', position: 1 })
  const { sent } = await openMine(
    view({
      company: [time2, time1],
      mine: [first, second],
      order: [{ provider: time1.provider, accounts: [first.id, second.id, time2.id, time1.id] }],
    }),
  )
  expect(
    await screen.findByText('Sua ordem para Anthropic: Minha 1, Minha 2, Time 2, Time 1'),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: /^Dar / })).toBeNull()
  expect(screen.queryByRole('button', { name: /Time 1/ })).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: 'Subir Minha 2' }))
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({
    path: `/api/companies/${COMPANY.id}/model-account-orders/me/anthropic`,
    body: { ids: [second.id, first.id] },
  })
})

test('quem só lê a empresa liga, pausa e remove as próprias contas', async () => {
  const { sent } = await openMine(view({ mine: [accountOf({ label: 'Minha 1', owner: 'me' })] }))
  fireEvent.click(screen.getByRole('button', { name: 'Pausar Minha 1' }))
  expect(await screen.findByRole('button', { name: 'Retomar Minha 1' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Remover Minha 1' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Remover conta' }))
  expect(await screen.findByText('Nenhuma conta sua')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['PATCH', 'DELETE'])
})

test('Ligar conta na página da pessoa liga uma conta dela', async () => {
  const { sent } = await openMine(view())
  fireEvent.click(screen.getByRole('button', { name: 'Ligar conta' }))
  fireEvent.change(await screen.findByLabelText('Fornecedor'), { target: { value: 'openai' } })
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: 'Minha chave' } })
  fireEvent.change(screen.getByLabelText('Chave de API'), { target: { value: 'sk-minha-7777' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ligar conta' }))
  expect(await screen.findByText('Minha chave · chave …7777 · ligada')).toBeTruthy()
  expect(sent[0]?.body).toMatchObject({ owner: 'me', provider: 'openai' })
})

test('Tipos de conta: "Chave de API" sempre ligada, e cada assinatura manda a lista final', async () => {
  const shown = view()
  server.use(...centralHub([ACTIVE_CLIENT]))
  const { sent } = open(shown, `/operations/clients/${ACTIVE_CLIENT.companyId}`)
  expect(await screen.findByRole('heading', { name: 'Tipos de conta' })).toBeTruthy()
  expect(screen.getByText('Chave de API · sempre ligada')).toBeTruthy()
  expect(screen.getAllByRole('checkbox')).toHaveLength(2)

  fireEvent.click(screen.getByRole('checkbox', { name: 'Assinatura Claude' }))
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: 'Assinatura Claude' })).toHaveProperty(
      'checked',
      true,
    ),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Google' }))
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: 'Google' })).toHaveProperty('checked', true),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Assinatura Claude' }))
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: 'Assinatura Claude' })).toHaveProperty(
      'checked',
      false,
    ),
  )
  expect(sent.map((one) => one.body)).toEqual([
    { kinds: ['claude_subscription'] },
    { kinds: ['claude_subscription', 'google_cliproxy'] },
    { kinds: ['google_cliproxy'] },
  ])
})
