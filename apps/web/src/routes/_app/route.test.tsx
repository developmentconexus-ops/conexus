import { FAILURES, Problem } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'

const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const STATUS = { version: 'v0.1.0', lastStart: { state: 'NONE' }, previousStart: { state: 'NONE' } }
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function refusal(code: keyof typeof FAILURES) {
  const row = FAILURES[code]
  const body = Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId: 'a1b2c3',
  })
  return HttpResponse.json(body, { status: row.status })
}

function hub(state: { signedIn: boolean }) {
  server.use(
    http.get('*/api/sessions/current', () =>
      state.signedIn ? HttpResponse.json({ person: ANA }) : refusal('SESSION_REQUIRED'),
    ),
    http.put('*/api/sessions/current', () => {
      state.signedIn = true
      return HttpResponse.json({ person: ANA })
    }),
    http.get('*/api/status', () => HttpResponse.json(STATUS)),
  )
}

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('sem sessão, / leva a /login com o endereço de volta, sem desenhar a moldura', async () => {
  hub({ signedIn: false })
  const router = open('/')
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/login')
  expect(router.state.location.search).toEqual({ redirect: '/' })
  expect(screen.queryByRole('button', { name: 'Abrir navegação' })).toBeNull()
  expect(screen.queryByText(/Você entrou como/)).toBeNull()
})

test('com sessão, a moldura, "Você entrou como {nome}." e a versão do Hub', async () => {
  hub({ signedIn: true })
  open('/')
  expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
  expect(await screen.findByText('v0.1.0')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Conta de Ana Lima' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Abrir navegação' })).toBeTruthy()
  expect(screen.getAllByRole('link', { name: 'Início' }).length).toBeGreaterThan(0)
})

test('depois de entrar, abre a página pedida, não a de entrar', async () => {
  hub({ signedIn: false })
  const router = open('/?from=link')
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
  expect(router.state.location.href).toBe('/?from=link')
})

test('o Hub sem banco ao ler a sessão: "Não foi possível abrir o Conexus" com a frase, sem "Tentar de novo"', async () => {
  server.use(http.get('*/api/sessions/current', () => refusal('DATABASE_UNAVAILABLE')))
  open('/')
  expect(
    await screen.findByRole('heading', { name: 'Não foi possível abrir o Conexus' }),
  ).toBeTruthy()
  expect(screen.getByRole('alert').textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
})
