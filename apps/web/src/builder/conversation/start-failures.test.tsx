import { FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal, undecided } from '../../platform/test-hub.tsx'
import { PROJECT, SECOND } from './test-hub.tsx'
import { create, REQUEST, request, startHub, UNCONFIRMED } from './test-start.tsx'
import { EMPTY_CONVERSATION, REQUEST_NOT_SENT } from './text.ts'

// What the Hub refuses or leaves undecided when Início creates (step 13.1, criteria 9, 10 and 13).
const server = hubServer()
const home = startHub(server)

afterEach(() => sessionStorage.clear())

for (const code of [
  'PROJECT_NAME_TAKEN',
  'PROJECT_ADDRESS_TAKEN',
  'PROJECT_NAME_NO_ADDRESS',
] as const) {
  test(`${code}: a frase no campo do nome, e o pedido fica`, async () => {
    home({ project: () => refusal(code) })
    await request()
    create('Pedidos')
    expect(await screen.findByText(FAILURES[code].phrase, { exact: false })).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByLabelText('Nome do projeto').getAttribute('aria-invalid')).toBe('true'),
    )
    expect(screen.getByText(REQUEST)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

for (const code of ['COMPANY_DATABASE_PREPARING', 'COMPANY_DATABASE_UNAVAILABLE'] as const) {
  test(`${code}: a frase e "Tentar de novo", que manda o pedido outra vez`, async () => {
    let refuse = true
    const { projects, conexus } = home({ project: () => (refuse ? refusal(code) : undefined) })
    await request()
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(
      `${FAILURES[code].phrase} ${FAILURES[code].action}`,
    )
    refuse = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() =>
      expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`),
    )
    expect(projects).toHaveLength(2)
  })
}

for (const [name, answer] of undecided('{"project":{"id":"ppp')) {
  test(`${name}: "${UNCONFIRMED}" e a nova tentativa leva a mesma chave`, async () => {
    let cut = true
    const { projects } = home({ project: () => (cut ? answer() : undefined) })
    await request()
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    cut = false
    fireEvent.click(screen.getByRole('button', { name: 'Criar e começar' }))
    await waitFor(() => expect(projects).toHaveLength(2))
    expect(projects[1]?.key).toBe(projects[0]?.key)
  })
}

for (const [name, answer] of undecided('{"conversation":{"id":"ccc')) {
  test(`a conversa cortada depois do Projeto (${name}): tentar de novo não cria outro Projeto`, async () => {
    let cut = true
    const { projects, conversations, conexus } = home({
      answers: { create: () => (cut ? answer() : undefined) },
    })
    await request()
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    expect(screen.queryByRole('textbox', { name: 'Nome do projeto' })).toBeNull()
    expect(screen.getByText('Nome do projeto').nextElementSibling?.textContent).toBe('Pedidos')
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Abrir o Projeto' })).toBeTruthy()
    cut = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() =>
      expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`),
    )
    expect(projects).toHaveLength(1)
    expect(conversations()).toHaveLength(2)
    expect(conversations()[1]?.attemptKey).toBe(conversations()[0]?.attemptKey)
  })
}

test('a conversa cortada depois do Projeto: "Abrir o Projeto" abre a página sem conversa', async () => {
  const { conexus } = home({ answers: { create: () => HttpResponse.error() } })
  await request()
  create('Pedidos')
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir o Projeto' }))
  expect(await screen.findByText(EMPTY_CONVERSATION)).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe(PROJECT)
})

test('o modelo recusado depois do Projeto abre o Projeto com a frase', async () => {
  const { conversations, conexus } = home({
    answers: { create: () => refusal('MODEL_NO_ACCOUNT') },
  })
  await request()
  create('Pedidos')
  expect(await screen.findByText(new RegExp(REQUEST_NOT_SENT))).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe(PROJECT)
  expect(screen.getByText(EMPTY_CONVERSATION)).toBeTruthy()
  expect(conversations()).toHaveLength(1)
})

test('Criar numa empresa que o Hub já não acha', async () => {
  home({ project: () => refusal('NOT_FOUND') })
  await request()
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  create('Pedidos')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})
