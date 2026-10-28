import { PersonId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { ACTIVE_CLIENT, centralHub, hubServer } from '../../platform/test-hub.tsx'
import type { View } from './test-hub.tsx'
import { accountOf, choose, modelHub, pickFromMenu } from './test-hub.tsx'

const server = hubServer()
const MINE = `/companies/${COMPANY.id}/settings/model-accounts`
const OLD = [
  `/companies/${COMPANY.id}/model-account`,
  `/companies/${COMPANY.id}/settings/my-model-accounts`,
]

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    mayManage: false,
    ...fields,
  }
}

function open(shown: View, path = MINE) {
  const hub = modelHub(shown)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, router: conexus.router }
}

async function openMine(shown: View) {
  const hub = open(shown, MINE)
  await screen.findByRole('heading', { name: 'Suas contas' })
  return hub
}

test.each(OLD)('o endereço antigo %s não existe mais', async (old) => {
  const { router } = open(view({ mayManage: true }), old)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(router.state.location.pathname).toBe(old)
})

test('sem contas: "Nenhuma conta sua" e Ligar conta', async () => {
  await openMine(view())
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
  expect(screen.queryByRole('button', { name: /Time 1/ })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Mais ações para Minha 1' }))
  expect((await screen.findAllByRole('menuitem')).map((one) => one.textContent)).toEqual([
    'Renomear',
    'Pausar',
    'Remover…',
  ])
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })

  fireEvent.click(screen.getByRole('button', { name: 'Subir Minha 2' }))
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]).toMatchObject({
    path: `/api/companies/${COMPANY.id}/model-account-orders/me/anthropic`,
    body: { ids: [second.id, first.id] },
  })
})

test('quem só lê a empresa liga, pausa e remove as próprias contas', async () => {
  const { sent } = await openMine(view({ mine: [accountOf({ label: 'Minha 1', owner: 'me' })] }))
  await pickFromMenu('Minha 1', 'Pausar')
  expect(await screen.findByText('pausada')).toBeTruthy()
  await pickFromMenu('Minha 1', 'Remover…')
  fireEvent.click(await screen.findByRole('button', { name: 'Remover conta' }))
  expect(await screen.findByText('Nenhuma conta sua')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['PATCH', 'DELETE'])
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Suas contas' })),
  )
})

test('com contas, "Nenhuma conta sua" não aparece', async () => {
  await openMine(view({ mine: [accountOf({ label: 'Minha 1', owner: 'me' })] }))
  expect(screen.getByText('Minha 1')).toBeTruthy()
  expect(screen.queryByText('Nenhuma conta sua')).toBeNull()
})

test('Ligar conta na página da pessoa liga uma conta dela', async () => {
  const { sent } = await openMine(view())
  fireEvent.click(screen.getByRole('button', { name: 'Ligar conta' }))
  await choose(await screen.findByLabelText('Fornecedor'), 'OpenAI')
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: 'Minha chave' } })
  fireEvent.change(screen.getByLabelText('Chave de API'), { target: { value: 'sk-minha-7777' } })
  fireEvent.click(screen.getByRole('button', { name: 'Ligar conta' }))
  expect(await screen.findByText('Minha chave')).toBeTruthy()
  const said = within(screen.getByRole('region', { name: 'Suas contas' }))
    .getAllByRole('status')
    .find((one) => one.textContent === 'Minha chave · chave …7777 · ligada')
  expect(said?.className).toContain('sr-only')
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
