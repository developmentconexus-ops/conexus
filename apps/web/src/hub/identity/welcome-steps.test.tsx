import { FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { COMPANY_PATH, companyHub, companyView, openAt } from './test-hub.tsx'

const server = hubServer()
const WELCOME = `${COMPANY_PATH}/welcome`

function ready(fields: Parameters<typeof companyView>[0] = {}) {
  return companyView({ nickname: 'empresa-teste', ...fields })
}

const OPENING: [string, Parameters<typeof companyView>[0], string, string][] = [
  ['sem conta de modelo, o 2', {}, 'model-account', 'Ligue uma conta de modelo'],
  ['com conta e sem equipe, o 3', { accounts: 1 }, 'team', 'Convide sua equipe'],
  [
    'com conta e um convite, o 4',
    {
      accounts: 1,
      invitations: [
        { id: 'i'.repeat(32), email: 'a@example.test', role: 'member', state: 'PENDING' },
      ],
    },
    'build',
    'O que vamos construir primeiro?',
  ],
]

for (const [name, fields, step, title] of OPENING) {
  test(`a entrada abre no passo que falta: ${name}`, async () => {
    server.use(...companyHub(ready(fields)).handlers)
    const router = openAt(WELCOME)
    expect(await screen.findByRole('heading', { name: title })).toBeTruthy()
    expect(router.state.location.pathname).toBe(`${WELCOME}/${step}`)
  })
}

test('Passo 2: sem conta ligada, "Fazer depois" leva ao Passo 3 de 4', async () => {
  server.use(...companyHub(ready()).handlers)
  openAt(`${WELCOME}/model-account`)
  expect(await screen.findByText('Passo 2 de 4')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Continuar' })).toBeNull()
  fireEvent.click(await screen.findByRole('link', { name: 'Fazer depois' }))
  expect(await screen.findByRole('heading', { name: 'Convide sua equipe' })).toBeTruthy()
  expect(screen.getByText('Passo 3 de 4')).toBeTruthy()
})

test('Passo 2: com uma conta da empresa já ligada, o botão já diz Continuar', async () => {
  server.use(...companyHub(ready({ accounts: 1 })).handlers)
  openAt(`${WELCOME}/model-account`)
  expect(await screen.findByRole('link', { name: 'Continuar' })).toBeTruthy()
})

test('Passo 3: Voltar leva ao Passo 2, e "Fazer depois" ao Passo 4 de 4', async () => {
  server.use(...companyHub(ready()).handlers)
  openAt(`${WELCOME}/team`)
  expect(await screen.findByText('Passo 3 de 4')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe(
    `${WELCOME}/model-account`,
  )
  fireEvent.click(screen.getByRole('link', { name: 'Fazer depois' }))
  expect(await screen.findByText('Passo 4 de 4')).toBeTruthy()
})

test('Passo 3, convite: um e-mail inválido é recusado no campo; o convite enviado troca "Fazer depois" por Continuar', async () => {
  const hub = companyHub(ready())
  server.use(...hub.handlers)
  openAt(`${WELCOME}/team`)
  const email = await screen.findByLabelText('E-mail')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }))
  expect(await screen.findByText('Escreva um e-mail.')).toBeTruthy()
  expect(hub.invited).toHaveLength(0)
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }))
  expect((await screen.findByRole('status')).textContent).toBe(
    'Convite enviado para davi@example.test.',
  )
  expect(hub.invited).toEqual([{ email: 'davi@example.test', role: 'member' }])
  fireEvent.click(await screen.findByRole('link', { name: 'Continuar' }))
  expect(await screen.findByText('Passo 4 de 4')).toBeTruthy()
})

test('Passo 3, recusa do Hub: MEMBER_EXISTS fica no campo do e-mail', async () => {
  server.use(
    http.post(`*/api/companies/${COMPANY.id}/invitations`, () => refusal('MEMBER_EXISTS')),
    ...companyHub(ready()).handlers,
  )
  openAt(`${WELCOME}/team`)
  fireEvent.change(await screen.findByLabelText('E-mail'), {
    target: { value: 'davi@example.test' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }))
  expect((await screen.findByText(FAILURES.MEMBER_EXISTS.phrase)).getAttribute('role')).toBe(
    'alert',
  )
  await waitFor(() =>
    expect(screen.getByLabelText('E-mail').getAttribute('aria-invalid')).toBe('true'),
  )
  expect(screen.getByRole('link', { name: 'Fazer depois' })).toBeTruthy()
})

test('Passo 3 com a leitura das pessoas falhando: só a página de falha, sem a moldura do passo', async () => {
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/members`, () => refusal('DATABASE_UNAVAILABLE')),
    ...companyHub(ready({ accounts: 1 })).handlers,
  )
  openAt(`${WELCOME}/team`)
  expect(
    await screen.findByText(FAILURES.DATABASE_UNAVAILABLE.phrase, { exact: false }),
  ).toBeTruthy()
  expect(screen.getAllByRole('main')).toHaveLength(1)
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.queryByText('Passo 3 de 4')).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Convide sua equipe' })).toBeNull()
})

test('Passo 1 com a barra no fim do endereço: a empresa sem apelido fica no Passo 1', async () => {
  server.use(...companyHub(companyView()).handlers)
  const router = openAt(`${WELCOME}/company/`)
  expect(await screen.findByRole('heading', { name: 'Sua empresa' })).toBeTruthy()
  expect(router.state.location.pathname).toMatch(/\/welcome\/company\/?$/)
})

for (const role of ['admin', 'member'] as const) {
  for (const step of ['model-account', 'team', 'build']) {
    test(`${role} em welcome/${step} cai no Início`, async () => {
      server.use(...companyHub(ready({ role })).handlers)
      const router = openAt(`${WELCOME}/${step}`)
      expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
      expect(router.state.location.pathname).toBe(COMPANY_PATH)
    })
  }
}
