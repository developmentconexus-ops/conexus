import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ANA } from '../../platform/fixtures.ts'
import { hubServer, memberView } from '../../platform/test-hub.tsx'
import { preparationOf } from './preparation.ts'
import { COMPANY_PATH, companyHub, companyView, openAt } from './test-hub.tsx'

const server = hubServer()
const CARD = 'Termine de preparar a empresa'
const PENDING = { id: 'i'.repeat(32), email: 'bia@example.test', role: 'member', state: 'PENDING' }

function inicio(fields: Parameters<typeof companyView>[0]) {
  server.use(...companyHub(companyView({ nickname: 'empresa-teste', ...fields })).handlers)
  openAt(COMPANY_PATH)
}

async function ready() {
  await screen.findByRole('heading', { name: 'O que vamos construir?' })
  await screen.findByRole('heading', { name: 'Projetos' })
}

for (const role of ['owner', 'admin'] as const) {
  test(`${role}: falta a conta da empresa e a equipe, e o cartão mostra os dois passos por fazer`, async () => {
    inicio({ role })
    const card = within(await screen.findByRole('region', { name: CARD }))
    expect(card.getByText('Empresa: feito')).toBeTruthy()
    expect(card.getByText('Conta de modelo: falta')).toBeTruthy()
    expect(card.getByText('Convidar equipe: falta')).toBeTruthy()
  })
}

test('Continuar abre a seção que falta: Contas de modelo quando falta a conta', async () => {
  inicio({})
  const card = within(await screen.findByRole('region', { name: CARD }))
  fireEvent.click(card.getByRole('link', { name: 'Continuar' }))
  expect(await screen.findByRole('heading', { name: 'Contas de modelo' })).toBeTruthy()
  expect(screen.queryByRole('region', { name: CARD })).toBeNull()
})

test('com a conta ligada e sem equipe, Continuar abre Pessoas e convites', async () => {
  inicio({ accounts: 1 })
  const card = within(await screen.findByRole('region', { name: CARD }))
  expect(card.getByText('Conta de modelo: feito')).toBeTruthy()
  expect(card.getByText('Convidar equipe: falta')).toBeTruthy()
  fireEvent.click(card.getByRole('link', { name: 'Continuar' }))
  expect(await screen.findByRole('heading', { name: 'Pessoas e convites' })).toBeTruthy()
})

test('com outra pessoa na empresa, mas sem conta, falta só a conta', async () => {
  inicio({ others: 1 })
  const card = within(await screen.findByRole('region', { name: CARD }))
  expect(card.getByText('Convidar equipe: feito')).toBeTruthy()
  expect(card.getByText('Conta de modelo: falta')).toBeTruthy()
})

test('um convite pendente conta como equipe, e com a conta o cartão some', async () => {
  inicio({ accounts: 1, invitations: [PENDING] })
  await ready()
  expect(screen.queryByRole('region', { name: CARD })).toBeNull()
})

test('outra pessoa na empresa conta como equipe, e com a conta o cartão some', async () => {
  inicio({ accounts: 1, others: 1 })
  await ready()
  expect(screen.queryByRole('region', { name: CARD })).toBeNull()
})

test('um convite vencido não conta como equipe', async () => {
  inicio({ accounts: 1, invitations: [{ ...PENDING, state: 'EXPIRED' }] })
  const card = within(await screen.findByRole('region', { name: CARD }))
  expect(card.getByText('Convidar equipe: falta')).toBeTruthy()
})

test('o membro nunca vê o cartão', async () => {
  inicio({ role: 'member' })
  await ready()
  expect(screen.queryByRole('region', { name: CARD })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Continuar' })).toBeNull()
})

test('preparationOf: cada passo vem de um fato, e a equipe é outra pessoa ou convite pendente', () => {
  const ana = memberView({ ...ANA, personId: ANA.id, role: 'owner' })
  const bia = memberView({ ...ana, personId: 'p-bia', role: 'member' })
  const none = { companyAccounts: 0, members: [ana], invitations: [] }
  expect(preparationOf(none)).toEqual({ modelAccount: false, team: false })
  expect(preparationOf({ ...none, companyAccounts: 2 }).modelAccount).toBe(true)
  expect(preparationOf({ ...none, members: [ana, bia] }).team).toBe(true)
  expect(preparationOf({ ...none, invitations: [{ state: 'PENDING' }] }).team).toBe(true)
  expect(preparationOf({ ...none, invitations: [{ state: 'EXPIRED' }] }).team).toBe(false)
})
