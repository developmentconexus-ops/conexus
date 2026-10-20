import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { COMPANY_PATH, companyHub, companyView, openAt, saved } from './test-hub.tsx'

const server = hubServer()
const WELCOME = `${COMPANY_PATH}/welcome`

function save(nickname: string) {
  fireEvent.change(screen.getByLabelText('Apelido'), { target: { value: nickname } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar e continuar' }))
}

test('dono, empresa sem apelido: todo endereço dela leva ao Passo 1 de 4, Sua empresa', async () => {
  server.use(...companyHub(companyView()).handlers)
  const router = openAt(`${COMPANY_PATH}/projects`)
  expect(await screen.findByRole('heading', { name: 'Sua empresa' })).toBeTruthy()
  expect(screen.getByText('Passo 1 de 4')).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${WELCOME}/company`)
  expect(screen.queryByRole('navigation', { name: 'Navegação' })).toBeNull()
})

test('o nome da empresa é só leitura, o apelido vem sugerido e o endereço acompanha o que se digita', async () => {
  server.use(...companyHub(companyView()).handlers)
  openAt(COMPANY_PATH)
  const name = await screen.findByRole('definition')
  expect(name.textContent).toBe('Empresa Teste')
  expect(screen.queryByRole('textbox', { name: 'Nome da empresa' })).toBeNull()
  const nickname = screen.getByLabelText('Apelido')
  expect(nickname).toHaveProperty('value', 'empresa-teste')
  expect(screen.getByText('pedidos--empresa-teste.apps.example.test')).toBeTruthy()
  fireEvent.change(nickname, { target: { value: 'empresa-a' } })
  expect(await screen.findByText('pedidos--empresa-a.apps.example.test')).toBeTruthy()
})

for (const role of ['admin', 'member'] as const) {
  test(`${role}: uma empresa sem apelido é "não encontrado", em qualquer endereço dela`, async () => {
    server.use(...companyHub(companyView({ role })).handlers)
    for (const path of [COMPANY_PATH, `${WELCOME}/company`]) {
      openAt(path)
      expect(
        await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
      ).toBeTruthy()
      expect(screen.queryByLabelText('Apelido')).toBeNull()
      cleanup()
    }
  })
}

test('Passo 1: um apelido fora da forma recebe a frase no campo, sem pedido ao Hub', async () => {
  const hub = companyHub(companyView())
  server.use(...hub.handlers)
  openAt(COMPANY_PATH)
  await screen.findByLabelText('Apelido')
  save('Empresa A')
  expect(
    await screen.findByText('Use de 3 a 30 letras minúsculas, números ou hífens.'),
  ).toBeTruthy()
  expect(hub.nicknames).toHaveLength(0)
})

for (const [code, phrase] of [
  ['COMPANY_NICKNAME_TAKEN', 'Esse apelido já é usado por outra empresa. Escolha outro.'],
  ['COMPANY_NICKNAME_RESERVED', 'Esse apelido é reservado. Escolha outro.'],
] as const) {
  test(`Passo 1, ${code}: a frase no campo e o passo segue aberto`, async () => {
    server.use(...companyHub(companyView(), () => refusal(code)).handlers)
    const router = openAt(COMPANY_PATH)
    await screen.findByLabelText('Apelido')
    save('conexus')
    expect((await screen.findByText(phrase)).getAttribute('role')).toBe('alert')
    await waitFor(() =>
      expect(screen.getByLabelText('Apelido').getAttribute('aria-invalid')).toBe('true'),
    )
    expect(router.state.location.pathname).toBe(`${WELCOME}/company`)
  })
}

test('Passo 1: salvar manda o apelido e abre o Passo 2 de 4', async () => {
  const hub = companyHub(companyView())
  server.use(...hub.handlers)
  const router = openAt(COMPANY_PATH)
  await screen.findByLabelText('Apelido')
  save('empresa-a')
  expect(await screen.findByRole('heading', { name: 'Ligue uma conta de modelo' })).toBeTruthy()
  expect(screen.getByText('Passo 2 de 4')).toBeTruthy()
  expect(hub.nicknames).toEqual([{ nickname: 'empresa-a' }])
  expect(router.state.location.pathname).toBe(`${WELCOME}/model-account`)
})

test('Passo 1, 503: a frase da linha, sem "Tentar de novo"; salvar de novo manda o pedido outra vez', async () => {
  let refuse = true
  const view = companyView()
  const hub = companyHub(view, (nickname) =>
    refuse ? refusal('DATABASE_UNAVAILABLE') : saved(view, nickname),
  )
  server.use(...hub.handlers)
  openAt(COMPANY_PATH)
  await screen.findByLabelText('Apelido')
  save('empresa-a')
  expect(
    await screen.findByText(
      'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  refuse = false
  save('empresa-a')
  expect(await screen.findByRole('heading', { name: 'Ligue uma conta de modelo' })).toBeTruthy()
  expect(hub.nicknames).toEqual([{ nickname: 'empresa-a' }, { nickname: 'empresa-a' }])
})

test('Passo 1, 404 ao salvar: a empresa deixa de ser achada e a página diz não encontrado', async () => {
  const view = companyView()
  server.use(...companyHub(view, () => refusal('NOT_FOUND')).handlers)
  openAt(COMPANY_PATH)
  await screen.findByLabelText('Apelido')
  server.use(http.get(`*/api/companies/${COMPANY.id}`, () => refusal('NOT_FOUND')))
  save('empresa-a')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

test('Passo 1, COMPANY_NICKNAME_SET: outra aba salvou antes; relê a empresa e segue ao Passo 2', async () => {
  const view = companyView()
  server.use(
    ...companyHub(view, () => {
      view.nickname = 'empresa-a'
      return refusal('COMPANY_NICKNAME_SET')
    }).handlers,
  )
  openAt(COMPANY_PATH)
  await screen.findByLabelText('Apelido')
  save('empresa-b')
  expect(await screen.findByRole('heading', { name: 'Ligue uma conta de modelo' })).toBeTruthy()
})

test('salvo o apelido, o Passo 1 não volta: o endereço dele segue para o Passo 2', async () => {
  const view = companyView({ nickname: 'empresa-a' })
  server.use(...companyHub(view, (nickname) => saved(view, nickname)).handlers)
  const router = openAt(`${WELCOME}/company`)
  expect(await screen.findByRole('heading', { name: 'Ligue uma conta de modelo' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${WELCOME}/model-account`)
})
